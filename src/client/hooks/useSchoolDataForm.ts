import { useState, useEffect } from 'react';

interface UseSchoolDataFormParams {
    endpoint: string;
    dataEndpoint: string;
}

export function useSchoolDataForm({ endpoint, dataEndpoint }: UseSchoolDataFormParams) {
    const [schoolYears, setSchoolYears] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    //Fetch available school years
    useEffect(() => {
        fetch("/api/available-years")
            .then(res => {
                if (!res.ok) throw new Error("Server error: " + res.status);
                return res.json();
            })
            .then(data => {
                setSchoolYears(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Failed to load years", err);
                setSchoolYears([]);
            });
    }, []);

    //Fetch available grades when year is selected
    const fetchGrades = (yearId: string) => {
        if (!yearId) {
            setGrades([]);
            return;
        }
        fetch(`/api/available-grades?yearId=${yearId}`)
            .then(res => {
                if (!res.ok) throw new Error("Server error: " + res.status);
                return res.json();
            })
            .then(data => {
                setGrades(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Failed to load grades", err);
                setGrades([]);
            });
    };

    //Fetch autofill data
    const fetchAutofillData = (yearId: string, gradeId?: string) => {
        if (!yearId) return Promise.resolve(null);

        //If gradeId is provided, append it to the query, otherwise just send yearId
        const url = gradeId
            ? `${dataEndpoint}?yearId=${yearId}&gradeId=${gradeId}`
            : `${dataEndpoint}?yearId=${yearId}`;

        return fetch(url)
            .then(res => res.json())
            .catch(err => {
                console.error("Failed to fetch autofill data:", err);
                return null;
            });
    };

    //Submit form data
    const submitForm = async (formData: any) => {
        setLoading(true);
        setSubmitStatus('idle');

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                console.log("Successfully submitted data");
                setSubmitStatus('success');
                return { success: true };
            } else {
                console.error("Backend returned an error: ", response.status);
                setSubmitStatus('error');
                return { success: false, error: `Error: ${response.status}` };
            }
        } catch (error) {
            console.error("Error connecting to backend: ", error);
            setSubmitStatus('error');
            return { success: false, error: "Connection error" };
        } finally {
            setLoading(false);
        }
    };

    const resetSubmitStatus = () => {
        setSubmitStatus('idle');
    };

    return {
        schoolYears,
        grades,
        loading,
        submitStatus,
        fetchGrades,
        fetchAutofillData,
        submitForm,
        resetSubmitStatus
    };
}