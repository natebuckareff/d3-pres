import React, { FC } from "react";
import { useSlide } from "../hooks";

export const Slide1: FC = () => {
    useSlide();
    return <p>slide1</p>;
};
