import React from "react";
import ErrorPage from "./ErrorPage";

export default function NotFound() {
    return (
        <ErrorPage
            code="404"
            title="PAGE NOT FOUND"
            message="The page you are looking for does not exist or has been moved."
        />
    );
}