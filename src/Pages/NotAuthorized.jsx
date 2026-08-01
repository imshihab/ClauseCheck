import React from "react";
import ErrorPage from "./ErrorPage";

export default function NotAuthorized() {
    return (
        <ErrorPage
            code="AUTH REQUIRED"
            title="SIGN IN TO CONTINUE"
            message="You need to be signed in as an authorized reviewer to view this page."
        />
    );
}