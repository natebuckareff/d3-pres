import React, { FC } from "react";
import { useSlide } from "../hooks";

export const Slide2: FC = () => {
    useSlide();
    return <p>slide2</p>;
};
