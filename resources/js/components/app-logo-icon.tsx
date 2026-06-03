import { ImgHTMLAttributes } from 'react';
import logo from "@/images/main-logo.svg"
import logoWhite from "@/images/main-logo-white.svg";

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <>
            <img src={logo} {...props} className="block dark:hidden" alt="logo" />
            <img src={logoWhite} {...props} className="hidden dark:block" alt="logo" />
        </>
    );
}
