import React, { FC } from "react";
import { Slide0 } from "./slides/Slide0/Slide";
import { Slide1 } from "./slides/Slide1";
import { Slide2 } from "./slides/Slide2";
import { createGlobalStyle } from "styled-components";
import { useLocation } from "wouter";

interface SimpleRouter {
    default: string;
    routes: { [k: string]: JSX.Element };
}

const router: SimpleRouter = {
    default: "/slide/0",
    routes: {
        "/slide/0": <Slide0 />,
        "/slide/1": <Slide1 />,
        "/slide/2": <Slide2 />
    }
};

const GlobalStyle = createGlobalStyle`
    html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
    }
`;

export const Root: FC = () => {
    const [location, setLocation] = useLocation();
    const redirect = router.routes[location];
    if (redirect === undefined) {
        setLocation(router.default);
    }
    return (
        <>
            <GlobalStyle />
            {redirect || null}
        </>
    );
};
