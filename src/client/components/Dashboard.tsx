import {useEffect, useState} from "react";

export default function Dashboard() {
    const [test1, setTest1] = useState("");
    const [test2, setTest2] = useState("");
    useEffect(() => {
        fetch("/admin/test")
            .then(res => res.status === 200 ? res.json() : null)
            .then(data => setTest1(data !== null ? JSON.stringify(data) : ""));
        fetch("/test1")
            .then(res => res.status === 200 ? res.json() : null)
            .then(data => setTest2(data !== null ? JSON.stringify(data) : ""))
            .then(data => setTest2(data !== null ? JSON.stringify(data) : ""));
    }, [])
	return (
		<div>
            { test1 ? <p> Admin Here: {test1} </p> : "" }
            <p>
                {test2}
            </p>
			Dashboard
		</div>
	)
}