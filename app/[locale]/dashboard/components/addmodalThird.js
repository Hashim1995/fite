"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Input,
  Label,
  FormGroup,
  Button,
  FormFeedback,
  Spinner,
} from "reactstrap";
import { useTranslations } from "next-intl";
import Select from "react-select";
import { format, parseISO, parse } from "date-fns";
import { toBase64 } from "./options";
import { toast } from "react-toastify";
import { returnCurrentLangId } from "@/utils/currentLang";
import axios from "axios";
import { useSession } from "next-auth/react";
import { convertArray } from "@/utils/toLabelValue";
import { useParams } from "next/navigation";
import ConfirmationModal from "@/app/[locale]/components/ConfirmationModal";

const AddModalThird = ({
  extractData,
  setModal,
  setVisaAppointmentId,
  setShowPaymentTypeModal,
  setRefreshComponent,
}) => {
  const [loading, setLoading] = useState(false);
  const [transformedData, setTransformedData] = useState(null);
  const [nationalities, setNationalities] = useState(null);
  const [formattedFiles, setFormattedFiles] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const t = useTranslations();
  const router = useParams();

  const initializeFormattedFiles = (n) => {
    const initialFiles = Array.from({ length: n }, (_, index) => ({
      data: null,
      index: index,
    }));
    setFormattedFiles(initialFiles);
  };
  useEffect(() => {}, []);

  const {
    register,
    control,
    clearErrors,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const session = useSession();

  const onSubmit = async (formData) => {
    console.log(formData, "submited");
    const data = transformData(formData);
    // sendToBack(data);
    setTransformedData(data);
    setShowConfirmation(true);
  };

  const fetchNationalities = async () => {
    try {
      const res = await axios.get(
        `https://ivisavmlinux.azurewebsites.net/api/v1/nationality?Language=${returnCurrentLangId(
          router.locale
        )}`
      );

      setNationalities(res?.data?.data);
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

  const sendToBack = async (data) => {
    const token = session?.data?.user?.data?.token;

    setLoading(true);
    try {
      const response = await axios.post(
        "https://ivisavmlinux.azurewebsites.net/api/v1/visa",
        JSON.stringify(data),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response?.data) {
        setVisaAppointmentId(response?.data?.data?.createdAppointmentId);
      }
      toast.success(t("applyApprovedPayAndWaitForOeprator"));
      setShowPaymentTypeModal(true);
      setRefreshComponent((z) => !z);
      setModal(false);
    } catch (error) {
      if (Array.isArray(error?.response?.data?.messages)) {
        error?.response?.data?.messages?.map((z) => {
          toast.error(z);
        });
      } else {
        toast.error(t("ErrorOperation"));
      }
    }
    setLoading(false);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    if (transformedData) {
      sendToBack(transformedData);
    }
  };

  const transformData = (formData) => {
    let visaApplicants = [];

    for (let i = 0; i < extractData?.documentData?.length; i++) {
      let applicant = {
        firstname: formData[`firstname-${i}`],
        lastname: formData[`lastname-${i}`],
        email: formData[`email-${i}`],
        phoneNumber: formData[`phoneNumber-${i}`],
        countryCode: formData[`countryCode-${i}`],
        nationalityId: formData[`nationality-${i}`]?.value,
        dateOfBirth: formData[`dateOfBirth-${i}`],
        personalNo: formData[`personalNo-${i}`],
        gender: formData[`gender-${i}`]?.value,
        passportNo: formData[`passportNo-${i}`],
        passportDateOfIssue: formData[`passportDateOfIssue-${i}`],
        passportDateOfExpiry: formData[`passportDateOfExpiry-${i}`],
        isAdult: formData[`isAdult-${i}`]?.value === 2 ? false : true,
        hasEuropeanFamilyMember:
          formData[`hasEuropeanFamilyMember-${i}`]?.value === 2 ? true : false,
        otherCountryResidenceInformation:
          formData[`otherCountryResidenceInformation-${i}`],
        representative:
          formData[`isAdult-${i}`]?.value === 2
            ? {
                firstname: formData[`representativeFirstname-${i}`],
                lastname: formData[`representativeLastName-${i}`],
                email: formData[`representativeEmail-${i}`],
                phoneNumber: formData[`representativePhoneNumber-${i}`],
                address: formData[`representativeAddress-${i}`],
              }
            : null,
        europeanFamilyMember:
          formData[`hasEuropeanFamilyMember-${i}`]?.value === 2
            ? {
                firstname: formData[`hasEuropeanFamilyMemberFirstname-${i}`],
                lastname: formData[`hasEuropeanFamilyMemberLastName-${i}`],
                passport: formattedFiles[i]?.data?.file,
                passportFilename: formattedFiles[i]?.data?.fileName,
                passportContentType: formattedFiles[i]?.data?.type,
              }
            : null,
      };
      visaApplicants.push(applicant);
    }

    return { visaApplicants, discriminator: extractData?.visaDiscriminator };
  };

  useEffect(() => {
    fetchNationalities();
    initializeFormattedFiles(extractData?.documentData?.length);

    extractData?.documentData?.map((extractedItem, index) => {
      setValue(`isAdult-${index}`, {
        value: 1,
        label: t("yes"),
      });
      setValue(`hasEuropeanFamilyMember-${index}`, {
        value: 1,
        label: t("nope"),
      });
      setValue(
        `gender-${index}`,
        extractedItem?.gender == 1
          ? {
              value: 1,
              label: t("male"),
            }
          : extractedItem?.gender == 2
          ? {
              value: 2,
              label: t("female"),
            }
          : null
      );
      setValue(`firstname-${index}`, extractedItem?.firstname);
      setValue(`countryCode-${index}`, extractedItem?.countryCode);
      if (extractedItem?.dateOfBirth) {
        setValue(
          `dateOfBirth-${index}`,
          format(
            parse(extractedItem?.dateOfBirth, "dd.MM.yyyy", new Date()),
            "yyyy-MM-dd"
          )
        );
      }

      if (extractedItem?.dateOfExpiry) {
        setValue(
          `passportDateOfExpiry-${index}`,
          format(
            parse(extractedItem?.dateOfExpiry, "dd.MM.yyyy", new Date()),
            "yyyy-MM-dd"
          )
        );
      }

      if (extractedItem?.dateOfIssue) {
        setValue(
          `passportDateOfIssue-${index}`,
          format(
            parse(extractedItem?.dateOfIssue, "dd.MM.yyyy", new Date()),
            "yyyy-MM-dd"
          )
        );
      }

      setValue(`lastname-${index}`, extractedItem?.lastname);
      setValue(`nationality-${index}`, extractedItem?.nationality);
      setValue(`passportNo-${index}`, extractedItem?.passportNo);
      setValue(`personalNo-${index}`, extractedItem?.personalNo);
    });
  }, [extractData]);

  useEffect(() => {
    fetchNationalities();
  }, []);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleFileChange = async (event, index) => {
    const orginalFile = event.target.files[0]; // Get the first file
    if (orginalFile) {
      try {
        const base64 = await toBase64(orginalFile);
        setFormattedFiles((formattedFiles) =>
          formattedFiles?.map((file) =>
            file.index === index
              ? {
                  ...file,
                  data: {
                    file: base64,
                    fileName: orginalFile?.name,
                    type: orginalFile?.type,
                  },
                }
              : file
          )
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  const renderForm = (index) => {
    const isAdult = watch(`isAdult-${index}`)?.value;
    const hasEuropeanFamilyMember = watch(
      `hasEuropeanFamilyMember-${index}`
    )?.value;

    return (
      <div key={`form-${index}`} className="mb-4">
        <br />
        <h4 className="text-center">
          {t("applicant")} {index + 1}
        </h4>
        <div className="row">
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("firstname")} <span style={{ color: "red" }}>*</span>
              </Label>
              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("firstname")} ${t("IsRequired")}`,
                  },
                }}
                name={`firstname-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={errors?.[`firstname-${index}`] ? true : false}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="text"
                  />
                )}
              />
              {errors[`firstname-${index}`] && (
                <FormFeedback>
                  {errors[`firstname-${index}`].message}
                </FormFeedback>
              )}
            </div>
          </div>
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("lastname")} <span style={{ color: "red" }}>*</span>
              </Label>
              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("lastname")} ${t("IsRequired")}`,
                  },
                }}
                name={`lastname-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={errors?.[`lastname-${index}`] ? true : false}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="text"
                  />
                )}
              />
              {errors[`lastname-${index}`] && (
                <FormFeedback>
                  {errors[`lastname-${index}`].message}
                </FormFeedback>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("countryCode")} <span style={{ color: "red" }}>*</span>
              </Label>

              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("countryCode")} ${t("IsRequired")}`,
                  },
                }}
                name={`countryCode-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={errors?.[`countryCode-${index}`] ? true : false}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="text"
                  />
                )}
              />
              {errors[`countryCode-${index}`] && (
                <FormFeedback>
                  {errors[`countryCode-${index}`].message}
                </FormFeedback>
              )}
            </div>
          </div>
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("nationality")} <span style={{ color: "red" }}>*</span>
              </Label>
              {/* 
              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("nationality")} ${t("IsRequired")}`,
                  },
                }}
                name={`nationality-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={errors?.[`nationality-${index}`] ? true : false}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="text"
                  />
                )}
              /> */}

              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("nationality")} ${t("IsRequired")}`,
                  },
                }}
                name={`nationality-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Select
                    className="react-select"
                    options={convertArray(nationalities)}
                    value={value}
                    aria-invalid={errors?.[`nationality-${index}`]}
                    menuPortalTarget={document.body}
                    menuPosition={"fixed"}
                    onChange={onChange}
                    placeholder={t("select")}
                    styles={{
                      control: (baseStyles, state) => ({
                        ...baseStyles,
                        borderColor: errors?.[`nationality-${index}`]
                          ? "red !important"
                          : state.isFocused
                          ? "#86b7fe"
                          : baseStyles.borderColor,
                        boxShadow: errors?.[`nationality-${index}`]
                          ? "0 0 0 1px red !important"
                          : state.isFocused
                          ? "0 0 0 1px #86b7fe"
                          : baseStyles.boxShadow,
                        "&:hover": {
                          borderColor: errors?.[`nationality-${index}`]
                            ? "red !important"
                            : state.isFocused
                            ? "#86b7fe"
                            : baseStyles.borderColor,
                        },
                      }),
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
                  />
                )}
              />
              {errors?.[`nationality-${index}`] && (
                <div
                  style={{
                    width: "100%",
                    marginTop: " 0.25rem",
                    fontSize: " .875em",
                    color: "#dc3545",
                  }}
                >
                  {errors?.[`nationality-${index}`]?.message}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("dateOfBirth")} <span style={{ color: "red" }}>*</span>
              </Label>
              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("dateOfBirth")} ${t("IsRequired")}`,
                  },
                }}
                name={`dateOfBirth-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={errors?.[`dateOfBirth-${index}`] ? true : false}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="date"
                  />
                )}
              />
              {errors[`dateOfBirth-${index}`] && (
                <FormFeedback>
                  {errors[`dateOfBirth-${index}`].message}
                </FormFeedback>
              )}
            </div>
          </div>
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("personalNo")} <span style={{ color: "red" }}>*</span>
              </Label>

              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("personalNo")} ${t("IsRequired")}`,
                  },
                }}
                name={`personalNo-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={errors?.[`personalNo-${index}`] ? true : false}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="text"
                  />
                )}
              />
              {errors[`personalNo-${index}`] && (
                <FormFeedback>
                  {errors[`personalNo-${index}`].message}
                </FormFeedback>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("gender")} <span style={{ color: "red" }}>*</span>
              </Label>
              <br />
              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("gender")} ${t("IsRequired")}`,
                  },
                }}
                name={`gender-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Select
                    className="react-select"
                    options={[
                      {
                        value: 1,
                        label: t("male"),
                      },
                      {
                        value: 2,
                        label: t("female"),
                      },
                    ]}
                    value={value}
                    aria-invalid={errors?.[`gender-${index}`]}
                    menuPortalTarget={document.body}
                    menuPosition={"fixed"}
                    onChange={onChange}
                    styles={{
                      menuPortal: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused
                          ? "#ddd"
                          : errors[`gender-${index}`]
                          ? "#ddd"
                          : "red",
                        // overwrittes hover style
                        "&:hover": {
                          borderColor: state.isFocused
                            ? "#ddd"
                            : errors[`gender-${index}`]
                            ? "#ddd"
                            : "red",
                        },
                        zIndex: 9999,
                      }),
                    }}
                  />
                )}
              />
              {errors[`gender-${index}`] && (
                <div
                  style={{
                    width: "100%",
                    marginTop: " 0.25rem",
                    fontSize: " .875em",
                    color: "#dc3545",
                  }}
                >
                  {errors[`gender-${index}`].message}
                </div>
              )}
            </div>
          </div>
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("passportNo")} <span style={{ color: "red" }}>*</span>
              </Label>

              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("passportNo")} ${t("IsRequired")}`,
                  },
                }}
                name={`passportNo-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={errors?.[`passportNo-${index}`] ? true : false}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="text"
                  />
                )}
              />
              {errors[`passportNo-${index}`] && (
                <FormFeedback>
                  {errors[`passportNo-${index}`].message}
                </FormFeedback>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("passportDateOfIssue")}{" "}
                <span style={{ color: "red" }}>*</span>
              </Label>
              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("passportDateOfIssue")} ${t("IsRequired")}`,
                  },
                }}
                name={`passportDateOfIssue-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={
                      errors?.[`passportDateOfIssue-${index}`] ? true : false
                    }
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="date"
                  />
                )}
              />
              {errors[`passportDateOfIssue-${index}`] && (
                <FormFeedback>
                  {errors[`passportDateOfIssue-${index}`].message}
                </FormFeedback>
              )}
            </div>
          </div>
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("passportDateOfExpiry")}{" "}
                <span style={{ color: "red" }}>*</span>
              </Label>
              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("passportDateOfExpiry")} ${t("IsRequired")}`,
                  },
                }}
                name={`passportDateOfExpiry-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={
                      errors?.[`passportDateOfExpiry-${index}`] ? true : false
                    }
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="date"
                  />
                )}
              />
              {errors[`passportDateOfExpiry-${index}`] && (
                <FormFeedback>
                  {errors[`passportDateOfExpiry-${index}`].message}
                </FormFeedback>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("email")} <span style={{ color: "red" }}>*</span>
              </Label>

              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("email")} ${t("IsRequired")}`,
                  },
                  validate: {
                    checkOnlyEnglishChars: (value) =>
                      /^[\w\\.-]+@[\w\\.-]+\.\w+$/.test(value) ||
                      t("InvalidEmail"),
                  },
                }}
                name={`email-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={errors?.[`email-${index}`] ? true : false}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="text"
                  />
                )}
              />
              {errors[`email-${index}`] && (
                <FormFeedback>{errors[`email-${index}`].message}</FormFeedback>
              )}
            </div>
          </div>
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("phoneNumber")} <span style={{ color: "red" }}>*</span>
              </Label>

              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("phoneNumber")} ${t("IsRequired")}`,
                  },
                }}
                name={`phoneNumber-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Input
                    invalid={errors?.[`phoneNumber-${index}`] ? true : false}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    placeholder={t("Enter")}
                    type="text"
                  />
                )}
              />
              {errors[`phoneNumber-${index}`] && (
                <FormFeedback>
                  {errors[`phoneNumber-${index}`].message}
                </FormFeedback>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("isAdult")} <span style={{ color: "red" }}>*</span>
              </Label>
              <br />
              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("isAdult")} ${t("IsRequired")}`,
                  },
                }}
                name={`isAdult-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Select
                    className="react-select"
                    options={[
                      {
                        value: 1,
                        label: t("yes"),
                      },
                      {
                        value: 2,
                        label: t("no"),
                      },
                    ]}
                    value={value}
                    aria-invalid={errors?.[`isAdult-${index}`]}
                    menuPortalTarget={document.body}
                    menuPosition={"fixed"}
                    onChange={(e) => {
                      onChange(e);
                      clearErrors(`representativeFirstname-${index}`);
                      clearErrors(`representativeLastName-${index}`);
                      clearErrors(`representativeEmail-${index}`);
                      clearErrors(`representativePhoneNumber-${index}`);
                      clearErrors(`representativeAddress-${index}`);

                      setValue(`representativeFirstname-${index}`, "");
                      setValue(`representativeLastName-${index}`, "");
                      setValue(`representativeEmail-${index}`, "");
                      setValue(`representativePhoneNumber-${index}`, "");
                      setValue(`representativeAddress-${index}`, "");
                    }}
                    styles={{
                      menuPortal: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused
                          ? "#ddd"
                          : errors[`isAdult-${index}`]
                          ? "#ddd"
                          : "red",
                        // overwrittes hover style
                        "&:hover": {
                          borderColor: state.isFocused
                            ? "#ddd"
                            : errors[`isAdult-${index}`]
                            ? "#ddd"
                            : "red",
                        },
                        zIndex: 9999,
                      }),
                    }}
                  />
                )}
              />
              {errors[`isAdult-${index}`] && (
                <div
                  style={{
                    width: "100%",
                    marginTop: " 0.25rem",
                    fontSize: " .875em",
                    color: "#dc3545",
                  }}
                >
                  {errors[`isAdult-${index}`].message}
                </div>
              )}
            </div>
          </div>
          <div className="col-sm-6">
            <div className="mb-3">
              <Label>
                {t("hasEuropeanFamilyMember")}{" "}
                <span style={{ color: "red" }}>*</span>
              </Label>
              <br />
              <Controller
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: `${t("hasEuropeanFamilyMember")} ${t(
                      "IsRequired"
                    )}`,
                  },
                }}
                name={`hasEuropeanFamilyMember-${index}`}
                render={({ field: { onChange, value } }) => (
                  <Select
                    className="react-select"
                    options={[
                      {
                        value: 1,
                        label: t("nope"),
                      },
                      {
                        value: 2,
                        label: t("have"),
                      },
                    ]}
                    value={value}
                    aria-invalid={errors?.[`hasEuropeanFamilyMember-${index}`]}
                    menuPortalTarget={document.body}
                    menuPosition={"fixed"}
                    onChange={(e) => {
                      onChange(e);
                      clearErrors(`hasEuropeanFamilyMemberFirstname-${index}`);
                      clearErrors(`hasEuropeanFamilyMemberLastName-${index}`);
                      clearErrors(`hasEuropeanFamilyMemberPassport-${index}`);
                      clearErrors(`otherCountryResidenceInformation-${index}`);

                      setValue(`hasEuropeanFamilyMemberFirstname-${index}`, "");
                      setValue(`hasEuropeanFamilyMemberLastName-${index}`, "");
                      setValue(`otherCountryResidenceInformation-${index}`, "");
                      setValue(
                        `hasEuropeanFamilyMemberPassport-${index}`,
                        null
                      );
                    }}
                    styles={{
                      menuPortal: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused
                          ? "#ddd"
                          : errors[`hasEuropeanFamilyMember-${index}`]
                          ? "#ddd"
                          : "red",
                        // overwrittes hover style
                        "&:hover": {
                          borderColor: state.isFocused
                            ? "#ddd"
                            : errors[`hasEuropeanFamilyMember-${index}`]
                            ? "#ddd"
                            : "red",
                        },
                        zIndex: 9999,
                      }),
                    }}
                  />
                )}
              />
              {errors[`isAdult-${index}`] && (
                <div
                  style={{
                    width: "100%",
                    marginTop: " 0.25rem",
                    fontSize: " .875em",
                    color: "#dc3545",
                  }}
                >
                  {errors[`isAdult-${index}`].message}
                </div>
              )}
            </div>
          </div>
        </div>
        {isAdult === 2 ? (
          <>
            <hr />
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <Label>
                    {t("representativeFirstname")}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </Label>

                  <Controller
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: `${t("representativeFirstname")} ${t(
                          "IsRequired"
                        )}`,
                      },
                    }}
                    name={`representativeFirstname-${index}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        invalid={
                          errors?.[`representativeFirstname-${index}`]
                            ? true
                            : false
                        }
                        value={value}
                        onChange={onChange}
                        className="form-control"
                        placeholder={t("Enter")}
                        type="text"
                      />
                    )}
                  />
                  {errors[`representativeFirstname-${index}`] && (
                    <FormFeedback>
                      {errors[`representativeFirstname-${index}`].message}
                    </FormFeedback>
                  )}
                </div>
              </div>
              <div className="col-sm-6">
                <div className="mb-3">
                  <Label>
                    {t("representativeLastName")}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </Label>

                  <Controller
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: `${t("representativeLastName")} ${t(
                          "IsRequired"
                        )}`,
                      },
                    }}
                    name={`representativeLastName-${index}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        invalid={
                          errors?.[`representativeLastName-${index}`]
                            ? true
                            : false
                        }
                        value={value}
                        onChange={onChange}
                        className="form-control"
                        placeholder={t("Enter")}
                        type="text"
                      />
                    )}
                  />
                  {errors[`representativeLastName-${index}`] && (
                    <FormFeedback>
                      {errors[`representativeLastName-${index}`].message}
                    </FormFeedback>
                  )}
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <Label>
                    {t("representativeEmail")}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </Label>

                  <Controller
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: `${t("representativeEmail")} ${t(
                          "IsRequired"
                        )}`,
                      },
                      validate: {
                        checkOnlyEnglishChars: (value) =>
                          /^[\w\\.-]+@[\w\\.-]+\.\w+$/.test(value) ||
                          t("InvalidEmail"),
                      },
                    }}
                    name={`representativeEmail-${index}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        invalid={
                          errors?.[`representativeEmail-${index}`]
                            ? true
                            : false
                        }
                        value={value}
                        onChange={onChange}
                        className="form-control"
                        placeholder={t("Enter")}
                        type="email"
                      />
                    )}
                  />
                  {errors[`representativeEmail-${index}`] && (
                    <FormFeedback>
                      {errors[`representativeEmail-${index}`].message}
                    </FormFeedback>
                  )}
                </div>
              </div>
              <div className="col-sm-6">
                <div className="mb-3">
                  <Label>
                    {t("representativePhoneNumber")}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </Label>
                  <Controller
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: `${t("representativePhoneNumber")} ${t(
                          "IsRequired"
                        )}`,
                      },
                    }}
                    name={`representativePhoneNumber-${index}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        invalid={
                          errors?.[`representativePhoneNumber-${index}`]
                            ? true
                            : false
                        }
                        value={value}
                        onChange={onChange}
                        className="form-control"
                        placeholder={t("Enter")}
                        type="text"
                      />
                    )}
                  />
                  {errors[`representativePhoneNumber-${index}`] && (
                    <FormFeedback>
                      {errors[`representativePhoneNumber-${index}`].message}
                    </FormFeedback>
                  )}
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <Label>
                    {t("representativeAddress")}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </Label>

                  <Controller
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: `${t("representativeAddress")} ${t(
                          "IsRequired"
                        )}`,
                      },
                    }}
                    name={`representativeAddress-${index}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        invalid={
                          errors?.[`representativeAddress-${index}`]
                            ? true
                            : false
                        }
                        value={value}
                        onChange={onChange}
                        className="form-control"
                        placeholder={t("Enter")}
                        type="text"
                      />
                    )}
                  />
                  {errors[`representativeAddress-${index}`] && (
                    <FormFeedback>
                      {errors[`representativeAddress-${index}`].message}
                    </FormFeedback>
                  )}
                </div>
              </div>
            </div>
            <hr />
          </>
        ) : null}
        {hasEuropeanFamilyMember === 2 ? (
          <>
            <hr />
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <Label>
                    {t("hasEuropeanFamilyMemberFirstname")}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </Label>

                  <Controller
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: `${t("hasEuropeanFamilyMemberFirstname")} ${t(
                          "IsRequired"
                        )}`,
                      },
                    }}
                    name={`hasEuropeanFamilyMemberFirstname-${index}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        invalid={
                          errors?.[`hasEuropeanFamilyMemberFirstname-${index}`]
                            ? true
                            : false
                        }
                        value={value}
                        onChange={onChange}
                        className="form-control"
                        placeholder={t("Enter")}
                        type="text"
                      />
                    )}
                  />
                  {errors[`hasEuropeanFamilyMemberFirstname-${index}`] && (
                    <FormFeedback>
                      {
                        errors[`hasEuropeanFamilyMemberFirstname-${index}`]
                          .message
                      }
                    </FormFeedback>
                  )}
                </div>
              </div>
              <div className="col-sm-6">
                <div className="mb-3">
                  <Label>
                    {t("hasEuropeanFamilyMemberLastName")}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </Label>

                  <Controller
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: `${t("hasEuropeanFamilyMemberLastName")} ${t(
                          "IsRequired"
                        )}`,
                      },
                    }}
                    name={`hasEuropeanFamilyMemberLastName-${index}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        invalid={
                          errors?.[`hasEuropeanFamilyMemberLastName-${index}`]
                            ? true
                            : false
                        }
                        value={value}
                        onChange={onChange}
                        className="form-control"
                        placeholder={t("Enter")}
                        type="text"
                      />
                    )}
                  />
                  {errors[`hasEuropeanFamilyMemberLastName-${index}`] && (
                    <FormFeedback>
                      {
                        errors[`hasEuropeanFamilyMemberLastName-${index}`]
                          .message
                      }
                    </FormFeedback>
                  )}
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <Label>
                    {t("hasEuropeanFamilyMemberPassport")}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </Label>

                  <Controller
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: `${t("hasEuropeanFamilyMemberPassport")} ${t(
                          "IsRequired"
                        )}`,
                      },
                    }}
                    name={`hasEuropeanFamilyMemberPassport-${index}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        invalid={
                          errors?.[`hasEuropeanFamilyMemberPassport-${index}`]
                            ? true
                            : false
                        }
                        value={value}
                        onChange={(e) => {
                          onChange(e);
                          handleFileChange(e, index);
                        }}
                        className="form-control"
                        placeholder={t("Enter")}
                        type="file"
                      />
                    )}
                  />
                  {errors[`hasEuropeanFamilyMemberPassport-${index}`] && (
                    <FormFeedback>
                      {
                        errors[`hasEuropeanFamilyMemberPassport-${index}`]
                          .message
                      }
                    </FormFeedback>
                  )}
                </div>
              </div>
              <div className="col-sm-6">
                <div className="mb-3">
                  <Label>
                    {t("otherCountryResidenceInformation")}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </Label>
                  <Controller
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: `${t("otherCountryResidenceInformation")} ${t(
                          "IsRequired"
                        )}`,
                      },
                    }}
                    name={`otherCountryResidenceInformation-${index}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        invalid={
                          errors?.[`otherCountryResidenceInformation-${index}`]
                            ? true
                            : false
                        }
                        value={value}
                        onChange={onChange}
                        className="form-control"
                        placeholder={t("Enter")}
                        type="text"
                      />
                    )}
                  />
                  {errors[`otherCountryResidenceInformation-${index}`] && (
                    <FormFeedback>
                      {
                        errors[`otherCountryResidenceInformation-${index}`]
                          .message
                      }
                    </FormFeedback>
                  )}
                </div>
              </div>
            </div>

            <hr />
          </>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {Array.from({ length: extractData?.documentData?.length }, (_, index) =>
          renderForm(index)
        )}
        <div className="mb-3 mb-3 d-flex justify-content-end">
          <Button
            disabled={loading}
            type="submit"
            className="theme-btn me-1 border-0 rounded-0 btn-style-one"
          >
            <span className="btn-title text-white">
              {loading ? (
                <Spinner
                  style={{ width: "0.7rem", height: "0.7rem" }}
                  type="grow"
                  color="light"
                />
              ) : (
                t("Send")
              )}
            </span>
          </Button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={showConfirmation}
        toggle={() => setShowConfirmation(false)}
        title={t("confirmation")}
        content={t("passportFinConfirmationText")}
        okText={t("yes")}
        closeText={t("no")}
        onConfirm={handleConfirm}
        loading={loading}
        disabled={!showConfirmation}
      />
    </>
  );
};

export default AddModalThird;
