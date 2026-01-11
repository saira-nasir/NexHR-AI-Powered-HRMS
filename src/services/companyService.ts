export const registerCompany = async (companyData: {
    name: string;
    industry: string;
    email: string;
    phone: string;
}) => {
    const token = localStorage.getItem("access_token");

    const response = await fetch("http://127.0.0.1:8000/api/auth/register-company/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(companyData),
    });
    

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || "Company registration failed");
    }

    return response.json();
};
