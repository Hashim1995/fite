"use client"

import { useState } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { signIn } from "next-auth/react"
import { Label, Spinner, Form, FormGroup, Input, Button } from "reactstrap"
import './login.scss'
import { useTranslations } from "next-intl";
import { toast } from "react-toastify"

export default function FormComponent() {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    const onSubmit = async (data) => {
        setLoading(true)
        const result = await signIn('credentials', {
            email: data.email,
            password: data.password,
            redirect: false,
            callbackUrl: "/",
        });
        setLoading(false);
        // try {
        //     const result = await signIn('credentials', {
        //         email: data.email,
        //         password: data.password,
        //         redirect: false,
        //         callbackUrl: "/",
        //     });
        //     setLoading(false);
        //     console.log(result, 'bilal');

        //     if (result?.error) {
        //         // Check if error is a string and parse it
        //         const errorObj = typeof result.error === 'string' ? JSON.parse(result.error) : result.error;
        //         console.log(errorObj, ' bilal parsed error');
        //         const messages = errorObj.messages || ['Xəta baş verdi'];
        //         toast(messages.join(', '), { hideProgressBar: true, autoClose: 1000, type: 'error', position: 'top-right' });
        //     }
        // } catch (err) {
        //     console.log(err);
        // }



    }
    const t = useTranslations();
    return (
        <section className="mt-10 flex flex-col items-center gap-4">


            <div className="container">
                <div className="row">
                    <div className="col-lg-3 col-md-2"></div>
                    <div className="col-lg-6 col-md-8 login-box">
                        <div className="col-lg-12 login-key">
                            <i className="fa fa-key" aria-hidden="true"></i>
                        </div>
                        <div className="col-lg-12 login-title">

                            {/* {signInCredentialsError && <p className="text-red-500">Invalid credentials</p>} */}

                        </div>

                        <div className="col-lg-12 login-form">
                            <div className="col-lg-12 gap-3 login-form">
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className="form-group mb-2">
                                        <label className="form-control-label">{t('email')}</label>
                                        <input type="email" placeholder={t('email')} {...register("email", { required: true })} className="form-control" />
                                    </div>
                                    <div className="form-group mb-2">
                                        <label className="form-control-label">{t('password')}</label>
                                        <input type="password" placeholder={t('password')} {...register("password", { required: true })} className="form-control" i />
                                    </div>

                                    <div className="col-lg-12 loginbttm">
                                        <div className="col-lg-6 login-btm login-text">
                                        </div>
                                        <div className="col-lg-6 login-btm login-button">
                                            <Button disabled={loading} type="submit" className="theme-btn border-0 rounded-0 btn-style-one"><span className="btn-title text-white">{
                                                loading ?
                                                    <Spinner
                                                        style={{ width: "0.7rem", height: "0.7rem" }}
                                                        type="grow"
                                                        color="light"
                                                    /> : t('login')}</span></Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-2"></div>
                    </div>
                </div>
            </div>
        </section>
    )
}
