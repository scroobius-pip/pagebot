// import { KindeProvider } from "@kinde-oss/kinde-auth-react";
// import '@kinde-oss/kinde-auth-pkce-js';
// import('@kinde-oss/kinde-auth-pkce-js')
import createKindeClient from "@kinde-oss/kinde-auth-pkce-js";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {


    return <div className=' '>
        {children}
    </div>

}