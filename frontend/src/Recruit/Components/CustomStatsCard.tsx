import { Card } from "@fluentui/react-components";
import * as React from "react";

interface CustomStatsCardTypes {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: string;
}

const CustomStatsCard: React.FC<CustomStatsCardTypes> = (props) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 !rounded-2xl !bg-white/75 backdrop-blur-md hover:!bg-white/90 hover:shadow-lg hover:-translate-y-0.5 border border-white/90 shadow-sm ${props.style || ""}`}
      style={{
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderRadius: "16px",
      }}
      onClick={props.onClick}
    >
      {props.children}
    </Card>
  );
};

export default CustomStatsCard;