import {TEST_ROUTE} from "@/APIRoutes";

export async function testReqBackend(){
    const data = await fetch(TEST_ROUTE).then(res => res.json());
    return {testField1: data.Test1, testField2: data.test2};
}