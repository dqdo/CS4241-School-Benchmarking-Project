"use client"
import {useEffect, useState} from "react";
import {testReqBackend} from "@/database/TestReq";

export type DatabaseInfo = {
    testField1: string;
    testField2: string;
}
export default function TestPage (){
    const [testInfo, setTestInfo] = useState<DatabaseInfo>({testField1: "", testField2: ""});

    useEffect(() => {
        testReqBackend().then(res => setTestInfo(res));
    }, [])

    return (
        <div>
            <h1>Test Page</h1>
            <p>Test Data 1 from Database: {testInfo.testField1}</p>
            <p>Test Data 1 from Database: {testInfo.testField2}</p>
        </div>
    )
}