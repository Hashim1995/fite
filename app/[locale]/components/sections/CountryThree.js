import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import React from 'react';
import { returnCurrentLangId } from '../../../../utils/currentLang';
import { truncate } from '../../../../utils/truncate';
async function getData() {
    const t = await getLocale();
    const res = await fetch(`https://ivisaapp.azurewebsites.net/api/v1/country?Language=${returnCurrentLangId(t)}`, {
        method: 'GET'
    })
    if (!res.ok) {
        return null
    }
    return res.json()
}


const CountryThree = async () => {
    const res = await getData();
    const data = res?.data

    return (
        <>
            <section className="countries-section-three">
                <div className="anim-icons">
                    <span className="icon icon-object-1" />
                </div>
                <div className="outer-box pt-0">
                    <div className="auto-container">
                        <div className="sec-title text-center">
                            <span className="sub-title">Countries we offer</span>
                            <h2>Countries We Support <br />for Immigration.</h2>
                        </div>
                        {/*  Countries Carousel */}
                        <div className="row">
                            {data.map((item, i) => (
                                <div key={i} className="country-block-three col-lg-4 col-md-6 col-sm-12">
                                    <div className="inner-box">
                                        <div className="content">
                                            <div className="flag">  <img alt="img" style={{
                                                width: '53px',
                                                height: '53px',

                                            }} src={`https://ivisaapp.azurewebsites.net/${item?.flagUrl}`} title="Vixoz" /></div>
                                            <h5 className="title">{item.title}</h5>
                                            <div style={{ minHeight: '72px' }} className="text">{truncate(item.description, 100, 80)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bottom-text">Top Rated By Customers &amp; Immigration Firms With 100% Success Rate.</div>
                    </div>
                </div>
            </section>

        </>
    );
};

export default CountryThree;