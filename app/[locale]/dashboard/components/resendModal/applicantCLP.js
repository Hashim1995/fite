"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { BiPlus, BiTrash } from "react-icons/bi";
import {
  AccordionBody,
  AccordionHeader,
  AccordionItem,
  Button,
  Input,
  Label,
  Table,
} from "reactstrap";
import AddFileToApplicantModal from "./addFileToApplicantModal";
import { DocumentTypes, getEnumLabel } from "../options";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import axios from "axios";
import { useTranslations } from "next-intl";
import { FcOk, FcHighPriority, FcQuestions } from "react-icons/fc";

const ApplicantCLP = ({
  applicant,
  rootSetValue,
  rootWatch,
  rootgetValues,
  setRemovedDocsFromBack,
}) => {
  const [modal, setModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      list: [],
    },
  });
  const session = useSession();
  const token = session?.data?.user?.data?.token;
  const t = useTranslations();

  const downloadFileFromServer = async (param) => {
    try {
      const response = await axios.get(
        `https://ivisaapp.azurewebsites.net/api/v1/visa/required-documents/download/${param}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = new Uint8Array([response?.data]);
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = param; // Specify the filename here
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      if (Array.isArray(error?.response?.data?.messages)) {
        error?.response?.data?.messages?.map((z) => {
          toast.error(z);
        });
      } else {
        toast.error(t("ErrorOperation"));
      }
    }
  };

  const dowloadFile = (file) => {
    if (typeof file === "string") {
      downloadFileFromServer(file);
      return;
    } else {
      console.log(file, "hashim");
      const a = document.createElement("a");
      a.href = file?.file;
      a.download = file?.fileName;
      a.click();
    }
  };

  useEffect(() => {
    applicant?.visaDocuments?.map((aplcnt) => {
      const prev = watch("list");
      const prevRoot = rootWatch(`${applicant?.id}`);
      const payload = {
        documentType: aplcnt?.documentType,
        file: aplcnt?.uri,
        id: aplcnt?.id,
        clientId: self.crypto.randomUUID(),
        isConfirmed: aplcnt?.isConfirmed,
        isBack: true,
      };
      setValue("list", [...prev, payload]);
      rootSetValue(`${applicant?.id}`, [...prevRoot, payload]);
    });
  }, [applicant]);

  return (
    <AccordionItem className="mb-3">
      <AccordionHeader targetId={applicant?.id}>
        <div className="d-flex align-items-center justify-content-between w-100 me-4">
          <div>
            {`${applicant?.firstname} ${applicant?.lastname} (${applicant?.passportNo})`}
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setModal(true);
            }}
            outline
            color="primary"
          >
            <BiPlus />
          </Button>
        </div>
      </AccordionHeader>
      <AccordionBody className="p-0" accordionId={applicant?.id}>
        <div className="">
          <div className="col-sm-6">
            <div className="mb-3 d-flex">
              <Label>{t("meetDate")}</Label>
              <Input
                value={applicant?.meetingDate}
                disabled
                className="form-control"
              />
            </div>
          </div>
        </div>
        <Table size="sm" bordered striped responsive hover>
          <thead>
            <tr>
              <th textTransform="initial">SƏNƏDİN ADI</th>
              <th textTransform="initial">SƏNƏD</th>
              <th textTransform="initial">STATUS</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {watch("list")?.map((z) => (
              <tr>
                <td>
                  {z?.documentType?.label ||
                    getEnumLabel(DocumentTypes, z?.documentType)}
                </td>
                <td
                  style={{
                    cursor: "pointer",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => dowloadFile(z?.file)}
                  className=" text-primary pointer-event"
                >
                  {z?.file?.fileName || z?.file}
                </td>
                <td className="text-center">
                  {z?.isBack ? (
                    z?.isConfirmed ? (
                      <FcOk />
                    ) : (
                      <FcHighPriority />
                    )
                  ) : (
                    <FcQuestions />
                  )}
                </td>
                <td className="text-center">
                  <Button
                    disabled={z?.isConfirmed}
                    onClick={(e) => {
                      e.stopPropagation();
                      setValue(
                        "list",
                        getValues().list?.filter(
                          (d) => z?.clientId !== d?.clientId
                        )
                      );
                      rootSetValue(
                        `${applicant?.id}`,
                        rootgetValues()[applicant?.id]?.filter(
                          (d) => z?.clientId !== d?.clientId
                        )
                      );
                      if (z?.isBack) {
                        setRemovedDocsFromBack((prev) => [...prev, z]);
                      }
                    }}
                    outline
                    color="danger"
                  >
                    <BiTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </AccordionBody>

      {modal && (
        <AddFileToApplicantModal
          parentSetter={setValue}
          parentWatch={watch}
          rootSetValue={rootSetValue}
          modal={modal}
          setModal={setModal}
          applicant={applicant}
          rootWatch={rootWatch}
        />
      )}
    </AccordionItem>
  );
};

export default ApplicantCLP;