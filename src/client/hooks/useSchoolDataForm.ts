import { useState, useEffect } from 'react';

interface UseSchoolDataFormParams {
    endpoint: string;
    dataEndpoint: string;
    schoolId: string | null;
}

export function useSchoolDataForm({ endpoint, dataEndpoint, schoolId }: UseSchoolDataFormParams) {
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
        if (!yearId || !schoolId) return Promise.resolve(null);

        let url = `${dataEndpoint}?yearId=${yearId}&schoolId=${schoolId}`;
        if (gradeId) url += `&gradeId=${gradeId}`;

        return fetch(url)
            .then(res => res.json())
            .catch(err => {
                console.error("Failed to fetch autofill data:", err);
                return null;
            });
    };

    //Submit form data
    const submitForm = async (formData: any) => {
        if (!schoolId) return { success: false, error: "No school selected" };

        setLoading(true);
        setSubmitStatus('idle');

        try {
            const payload = { ...formData, SCHOOL_ID: schoolId };
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSubmitStatus('success');
                return { success: true };
            } else {
                setSubmitStatus('error');
                return { success: false, error: `Error: ${response.status}` };
            }
        } catch (error) {
            setSubmitStatus('error');
            return { success: false, error: "Connection error" };
        } finally {
            setLoading(false);
        }
    };

    // --- Draft Functions ---
    const saveDraft = async (formType: string, formData: any) => {
        if (!schoolId) return { success: false };
        const payload = { formType, draftData: formData, SCHOOL_ID: schoolId };
        const res = await fetch("/api/save-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        return { success: res.ok };
    };

    const loadDraft = async (formType: string, yearId: string, gradeId?: string) => {
        if (!schoolId || !yearId) return null;
        let url = `/api/get-draft?formType=${formType}&SCHOOL_YR_ID=${yearId}&schoolId=${schoolId}`;
        if (gradeId) url += `&GRADE_DEF_ID=${gradeId}`;
        const res = await fetch(url);
        return await res.json();
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
        saveDraft,
        loadDraft,
        resetSubmitStatus
    };
}