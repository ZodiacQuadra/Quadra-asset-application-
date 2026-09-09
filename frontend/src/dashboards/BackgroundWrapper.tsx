import React, { CSSProperties, ReactNode } from "react";

// interface BackgroundWrapperProps {
//   children: ReactNode;
//   imageUrl?: string;
//   style?: CSSProperties;
//   varient:'plane'|'gradient'
// }
interface BackgroundWrapperProps {
  children: ReactNode;
  style?: CSSProperties;
  variant:
    | "plane"
    | "recruit-bg"
    | "bgv-bg"
    | "onboarding"
    | "offboarding"
    | "Management"
    | "attendance"
    | "asset"
    | "gradient";
}

const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({
  children,
  style = {},
  variant = "plane",
}) => {
  // Map variants to image paths
  const getImageUrl = () => {
    switch (variant) {
      case "recruit-bg":
        return "/recruitbg-6.png";
      case "bgv-bg":
        return "/BGVImage.png";
      case "onboarding":
        return "/InductionBg.png";
      case "offboarding":
        return "/Offboardingbg.png";
      case "Management":
        return "/ManagementBg.png";
      case "attendance":
        return "/AttendanceBg.png";
      case "asset":
        return "/AssetBg.png";
      case "gradient":
        return "/ApplicatiionBg.png";
      default:
        return null;
    }
  };
  const imageUrl = getImageUrl();
  const containerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f8fafc",
    ...style,
  };

  const topImageStylePlane: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "480px",
    background: "#f8fafc",
    zIndex: 1,
  };
  const topImageStyle: CSSProperties =
    variant === "plane" || !imageUrl
      ? topImageStylePlane
      : {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "560px",
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center top",
          zIndex: 1,
          opacity: 0.9,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)",
        };

  const fadeStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 2,
    background: "linear-gradient(to bottom, rgba(248, 250, 252, 0.02) 0%, rgba(248, 250, 252, 0.15) 180px, rgba(248, 250, 252, 0.6) 380px, #f8fafc 520px, #f8fafc 100%)",
    pointerEvents: "none",
  };

  const contentStyle: CSSProperties = {
    position: "relative",
    zIndex: 3,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  };

  return (
    <div style={containerStyle}>
      <div style={variant === "plane" ? topImageStylePlane : topImageStyle} />
      <div style={fadeStyle} />
      <div style={contentStyle}>{children}</div>
    </div>
  );
};

export default BackgroundWrapper;
