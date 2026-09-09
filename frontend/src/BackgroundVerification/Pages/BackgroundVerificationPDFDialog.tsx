import React, { useEffect, useId, useState } from "react";
import { usePDF } from "react-to-pdf";
import { format } from "date-fns";
import {
  ArrowDownloadFilled,
  Dismiss24Regular,
  Home20Regular,
} from "@fluentui/react-icons";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  makeStyles,
  OverlayDrawer,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";

import axios from "axios";
import { useAuth } from "../../Auth/AuthProvider";

const BackgroundVerificationPDFDialog = ({ code }: any) => {
  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);

  const [formData, setFormData] = useState({
    id: 0,
    code: "",
    fullName: "",
    fatherName: "",
    gender: "",
    maritalStatus: "",
    dateOfBirth: "",
    nationality: "",
    employeeCode: "",
    experienceLevel: "",
    dateOfJoining: "",
    designation: "",
    placeOfJoining: "",
    gmailAddress: "",

    criminalCheckCurrentAddress: "",
    currentFromDate: "",
    currentToDate: "",
    currentTelephone: "",
    currentMobile: "",
    permanentAddressSame: false,

    criminalCheckPermanentAddress: "",
    permanentFromDate: "",
    permanentToDate: "",
    permanentTelephone: "",
    permanentMobile: "",
    currentGmail: "",
    permanentGmail: "",
    year: "",
  });
  const [open, setOpen] = React.useState(false);
  const [employmentHistory, setEmploymentHistory]: any = useState([]);
  const { accessToken, currentUser, refreshToken }: any = useAuth();
  useEffect(() => {
    // console.log(code);
    const initializeForm = async () => {
      try {
        if (code) {
          try {
            fetchBGVData(code);
          } catch (e) {
            console.error("Error parsing initial data:", e);
          }
        }
      } catch (error) {
        console.error(
          "Error initializing Teams or fetching initial data:",
          error
        );
      }
    };

    initializeForm();
  }, [accessToken]);

  const { toPDF, targetRef } = usePDF({
    filename: "background_verification_form.pdf",
  });

  const fetchBGVData = async (code: any) => {
    try {
      // Fetch form data
      if (accessToken) {
        await refreshToken();
        const formResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/bgvRequest/getBGVRequestDetails/${code}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        // console.log(formResponse.data.data);
        if (formResponse.data.data.bgvRequest) {
          setFormData({
            id: formResponse.data.data.bgvRequest.BGVRequestID,
            code: formResponse.data.data.bgvRequest.BGVFormattedID,
            fullName: `${formResponse.data.data.bgvRequest.FirstName} ${formResponse.data.data.bgvRequest.LastName}`,
            fatherName: `${formResponse.data.data.bgvRequest.FatherName}`,
            gender: formResponse.data.data.bgvRequest.Gender,
            maritalStatus: formResponse.data.data.bgvRequest.MaritalStatus,
            dateOfBirth: new Date(
              formResponse.data.data.bgvRequest.DateOfBirth
            ).toLocaleDateString("en-GB"),
            nationality: formResponse.data.data.bgvRequest.Nationality,
            employeeCode: formResponse.data.data.bgvRequest.EmployeeCode,
            experienceLevel: formResponse.data.data.bgvRequest.ExperienceLevel,
            dateOfJoining: formResponse.data.data.bgvRequest.dateOfJoining
              ? new Date(
                  formResponse.data.data.bgvRequest.dateOfJoining
                ).toLocaleDateString("en-GB")
              : "-",
            designation: formResponse.data.data.bgvRequest.designation || "-",
            placeOfJoining:
              formResponse.data.data.bgvRequest.placeOfJoining || "-",
            gmailAddress: formResponse.data.data.bgvRequest.PersonalEmail,

            criminalCheckCurrentAddress:
              formResponse.data.data.bgvRequest.CurrentAddress,
            currentFromDate: new Date(
              formResponse.data.data.bgvRequest.CurrentFromDate
            ).toLocaleDateString("en-GB"),
            currentToDate: new Date(
              formResponse.data.data.bgvRequest.CurrentToDate
            ).toLocaleDateString("en-GB"),
            currentTelephone:
              formResponse.data.data.bgvRequest.CurrentTelephone,
            currentMobile: formResponse.data.data.bgvRequest.CurrentMobile,
            permanentAddressSame:
              formResponse.data.data.bgvRequest.PermanentAddressSame,

            criminalCheckPermanentAddress:
              formResponse.data.data.bgvRequest.PermanentAddress,
            permanentFromDate: new Date(
              formResponse.data.data.bgvRequest.PermanentFromDate
            ).toLocaleDateString("en-GB"),
            permanentToDate: new Date(
              formResponse.data.data.bgvRequest.PermanentToDate
            ).toLocaleDateString("en-GB"),
            permanentTelephone:
              formResponse.data.data.bgvRequest.PermanentTelephone,
            permanentMobile: formResponse.data.data.bgvRequest.PermanentMobile,
            currentGmail: formResponse.data.data.bgvRequest.currentGmail,
            permanentGmail: formResponse.data.data.bgvRequest.PersonalEmail,
            year: String(formResponse.data.data.bgvRequest.year || "-"),
          });
          // console.log(formResponse.data.data.bgvRequest);
        }

        // console.log(formResponse.data.data.bgvRequest.ExperienceLevel);
        if (
          formResponse.data.data.bgvRequest.ExperienceLevel == "Experienced"
        ) {
          setEmploymentHistory(
            formResponse.data.data.employmentHistory.map((val: any) => ({
              id: val.BGVRequestID,
              companyName: val.CompanyName,
              position: val.Position,
              headOfficeAddress: val.HeadOfficeAddress,
              headOfficePhone: val.HeadOfficePhone,
              branchOfficeAddress: val.BranchOfficeAddress,
              branchOfficePhone: val.BranchOfficePhone,
              employmentFrom: new Date(val.EmploymentFrom).toLocaleDateString(
                "en-GB"
              ),
              employmentTo: new Date(val.EmploymentTo).toLocaleDateString(
                "en-GB"
              ),
              employeeCode: val.EmployeeCode,
              employmentNature: val.EmploymentNature,
              agencyDetails: val.AgencyDetails,
              responsibilities: val.Responsibilities,
              lastCTC: val.LastCTC,
              reasonForLeaving: val.ReasonForLeaving,
              hrName: val.HRName,
              hrPosition: val.HRPosition,
              hrLandline: val.HRLandline,
              hrMobile: val.HRMobile,
              hrEmail: val.HREmail,
              reportingAuthorityName: val.ReportingAuthorityName,
              reportingAuthorityPosition: val.ReportingAuthorityPosition,
              reportingAuthorityLandline: val.ReportingAuthorityLandline,
              reportingAuthorityMobile: val.ReportingAuthorityMobile,
              reportingAuthorityEmail: val.ReportingAuthorityEmail,
              isNew: false,
            })) || []
          );
        }
      }

      // Fetch employment history
    } catch (error) {
      console.error("Error fetching BGV data:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to fetch BGV details</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const formatDate = (dateString: any) => {
    return dateString ? format(new Date(dateString), "dd/MM/yyyy") : "N/A";
  };

  return (
    <>
      <Button
        appearance="outline"
        icon={<ArrowDownloadFilled />}
        onClick={() => setOpen(true)}
        style={{ borderRadius: "20px" }}
      >
        Download PDF
      </Button>
      <OverlayDrawer
        as="aside"
        size="large"
        position="end"
        open={open}
        onOpenChange={(_, { open }) => setOpen(open)}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Dismiss24Regular />}
                onClick={(data: any) => setOpen(data.open)}
              />
            }
          >
            PDF Request
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody>
          <Button
            style={{ margin: "10px 0px", float: "right" }}
            appearance="primary"
            icon={<ArrowDownloadFilled />}
            onClick={() => toPDF()}
          >
            Download PDF
          </Button>{" "}
          <div ref={targetRef} className="bg-white p-6 rounded-lg shadow-lg">
            <div
              style={{
                textAlign: "start",
                color: "transparent",
                backgroundColor: "rgb(255, 255, 255)",
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  textAlign: "start",
                  color: "transparent",
                  backgroundColor: "rgb(255, 255, 255)",
                  fontSize: "12px",
                }}
              >
                <p style={{ textAlign: "center", color: "transparent" }}>
                  <br />
                </p>
                <table
                  border={1}
                  style={{
                    color: "transparent",
                    borderCollapse: "collapse",
                    marginLeft: "calc(1%)",
                    width: "99%",
                  }}
                >
                  <tbody style={{ color: "transparent" }}>
                    <tr style={{ color: "transparent" }}>
                      <td
                        colSpan={2}
                        style={{
                          color: "transparent",
                          border: "1px solid",
                          width: "1.1669%",
                        }}
                      >
                        <br />
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          color: "transparent",
                          border: "1px solid",
                          width: "98.7164%",
                        }}
                      >
                        <div
                          style={{
                            color: "transparent",
                            position: "relative",
                          }}
                        >
                          <div
                            className="OutlineElement Ltr SCXW258233678 BCX8"
                            style={{
                              WebkitTapHighlightColor: "transparent",
                              margin: "0px",
                              padding: "0px",
                              userSelect: "text",
                              clear: "both",
                              cursor: "text",
                              overflow: "visible",
                              position: "relative",
                              direction: "ltr",
                              color: "rgb(0, 0, 0)",
                              fontFamily:
                                '"Segoe UI", "Segoe UI Web", Arial, Verdana, sans-serif',
                              fontSize: "12px",
                              fontStyle: "normal",
                              fontVariantLigatures: "normal",
                              fontVariantCaps: "normal",
                              fontWeight: 400,
                              letterSpacing: "normal",
                              orphans: 2,
                              textAlign: "start",
                              textIndent: "0px",
                              textTransform: "none",
                              widows: 2,
                              wordSpacing: "0px",
                              WebkitTextStrokeWidth: "0px",
                              whiteSpace: "normal",
                              backgroundColor: "rgb(255, 255, 255)",
                              textDecorationThickness: "initial",
                              textDecorationStyle: "initial",
                              textDecorationColor: "initial",
                            }}
                          >
                            {" "}
                            <img
                              style={{
                                position: "sticky",
                                top: "10px",
                                left: "10px",
                                width: "110px",
                              }}
                              src="https://cdn.prod.website-files.com/5ff406c4e45fe6675ccc0ec4/625e7b7532d684e751be6fa8_Logo_Quadra_Small_200x52.png"
                            ></img>
                            <p
                              className="Paragraph SCXW258233678 BCX8"
                              style={{
                                WebkitTapHighlightColor: "transparent",
                                margin: "0px 0px 10.6667px -60px",
                                padding: "0px",
                                userSelect: "text",
                                overflowWrap: "break-word",
                                whiteSpace: "pre-wrap",
                                fontWeight: "normal",
                                fontStyle: "normal",
                                verticalAlign: "baseline",
                                fontKerning: "none",
                                backgroundColor: "transparent",
                                color: "windowtext",
                                textAlign: "center",
                                textIndent: "60px",
                              }}
                            >
                              <span
                                data-contrast="auto"
                                lang="EN-US"
                                className="TextRun SCXW258233678 BCX8"
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                  margin: "0px",
                                  padding: "0px",
                                  userSelect: "text",
                                  fontVariantLigatures: "none !important",
                                  fontSize: "15pt",
                                  lineHeight: "24.8208px",
                                  fontFamily:
                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                  fontWeight: "bold",
                                }}
                              >
                                <span
                                  className="NormalTextRun SCXW258233678 BCX8"
                                  style={{
                                    WebkitTapHighlightColor: "transparent",
                                    margin: "0px",
                                    padding: "0px",
                                    userSelect: "text",
                                  }}
                                >
                                  Background Verification Form
                                </span>
                              </span>
                              <br />
                              <span
                                data-contrast="auto"
                                lang="EN-US"
                                className="TextRun SCXW258233678 BCX8"
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                  margin: "0px",
                                  padding: "0px",
                                  userSelect: "text",
                                  fontVariantLigatures: "none !important",
                                  fontSize: "11pt",
                                  lineHeight: "18.3458px",
                                  fontFamily:
                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                  fontWeight: "bold",
                                }}
                              >
                                <span
                                  className="NormalTextRun SCXW258233678 BCX8"
                                  style={{
                                    WebkitTapHighlightColor: "transparent",
                                    margin: "0px",
                                    padding: "0px",
                                    userSelect: "text",
                                  }}
                                >
                                  &nbsp;
                                </span>
                              </span>
                              <span
                                className="EOP SCXW258233678 BCX8"
                                data-ccp-props='{"201341983":0,"335551550":2,"335551620":2,"335559685":-900,"335559731":900,"335559739":160,"335559740":259}'
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                  margin: "0px",
                                  padding: "0px",
                                  userSelect: "text",
                                  fontSize: "11pt",
                                  lineHeight: "18.3458px",
                                  fontFamily:
                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                }}
                              >
                                &nbsp;
                              </span>
                            </p>
                          </div>
                          <div
                            className="OutlineElement Ltr SCXW258233678 BCX8"
                            style={{
                              WebkitTapHighlightColor: "transparent",
                              margin: "0px",
                              padding: "0px",
                              userSelect: "text",
                              clear: "both",
                              cursor: "text",
                              overflow: "visible",
                              position: "relative",
                              direction: "ltr",
                              color: "rgb(0, 0, 0)",
                              fontFamily:
                                '"Segoe UI", "Segoe UI Web", Arial, Verdana, sans-serif',
                              fontSize: "12px",
                              fontStyle: "normal",
                              fontVariantLigatures: "normal",
                              fontVariantCaps: "normal",
                              fontWeight: 400,
                              letterSpacing: "normal",
                              orphans: 2,
                              textAlign: "start",
                              textIndent: "0px",
                              textTransform: "none",
                              widows: 2,
                              wordSpacing: "0px",
                              WebkitTextStrokeWidth: "0px",
                              whiteSpace: "normal",
                              backgroundColor: "rgb(255, 255, 255)",
                              textDecorationThickness: "initial",
                              textDecorationStyle: "initial",
                              textDecorationColor: "initial",
                            }}
                          >
                            <div
                              className="TableContainer Ltr SCXW258233678 BCX8"
                              style={{
                                WebkitTapHighlightColor: "transparent",
                                margin: "2px 0px 2px -5px",
                                padding: "0px",
                                userSelect: "text",
                                overflow: "visible",
                                position: "relative",
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <table
                                className="Table Ltr TableWordWrap SCXW258233678 BCX8"
                                border={1}
                                data-tablestyle="MsoNormalTable"
                                data-tablelook={480}
                                aria-rowcount={13}
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                  margin: "0px calc(0%) 0px calc(1%)",
                                  padding: "0px",
                                  userSelect: "text",
                                  tableLayout: "fixed",
                                  width: "99%",
                                  borderCollapse: "collapse",
                                  emptyCells: "show",
                                  position: "relative",
                                  overflow: "visible",
                                  background: "transparent",
                                  borderSpacing: "0px",
                                }}
                              >
                                <tbody
                                  className="SCXW258233678 BCX8"
                                  style={{
                                    WebkitTapHighlightColor: "transparent",
                                    margin: "0px",
                                    padding: "0px",
                                    userSelect: "text",
                                  }}
                                >
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={1}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "45px",
                                    }}
                                  >
                                    <td
                                      className="FirstRow FirstCol LastCol AdvancedProofingLightMode ContextualSpellingLightMode SpellingErrorLightMode SimilarityReviewedBlack SimilarityUnreviewedLightMode AddInCritiqueRedLightMode AddInCritiqueGreenLightMode AddInCritiqueBlueLightMode AddInCritiqueLavenderLightMode AddInCritiqueBerryLightMode HighContrastShading SCXW258233678 BCX8"
                                      data-celllook={69905}
                                      colSpan={4}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "middle",
                                        position: "relative",
                                        backgroundColor: "rgb(255, 255, 0)",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "707px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px 0px 10px 0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "center",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                color: "windowtext !important",
                                                fontSize: "22pt",
                                                lineHeight: "36.6917px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                fontWeight: "bold",
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Personal Details
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={2}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "28px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "middle",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "50.3403%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Employee:&nbsp;
                                              </span>
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                &nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.fullName || "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      data-celllook={4369}
                                      className="SCXW258233678 BCX8"
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "middle",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "24.6296%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Gender:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.gender || "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "middle",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "198px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Marital Status:
                                              </span>
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                &nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.maritalStatus ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={3}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "24px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "25.4306%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "12pt",
                                                lineHeight: "18px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  fontSize: "12pt",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Date of Birth:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "12pt",
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontSize: "12pt",
                                                }}
                                              >
                                                {formData.dateOfBirth || "N/A"}
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      data-celllook={4369}
                                      className="SCXW258233678 BCX8"
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "24.7375%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Nationality:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.nationality ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "middle",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "49.5393%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Father’s name:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.fatherName || "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={4}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "28px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "50.3404%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Employee Code:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.employeeCode ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "middle",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "49.5393%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Designation:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.designation ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={5}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "30px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "50.3404%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Place of Joining:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.placeOfJoining ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "middle",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "49.5393%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Date of Joining:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.dateOfJoining ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={6}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "76px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={4}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "707px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                fontWeight: "bold",
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Criminal through Court record
                                                check
                                              </span>
                                            </span>
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                &nbsp;
                                              </span>
                                            </span>
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                fontWeight: "bold",
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Current Address:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.criminalCheckCurrentAddress ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={7}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "80px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={4}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "707px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "12pt",
                                                lineHeight: "18px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Period of stay at current
                                                address:
                                              </span>
                                            </span>
                                            <br />
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "12pt",
                                                lineHeight: "18px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                From:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "12pt",
                                                  lineHeight: "18px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  data-ccp-parastyle="header"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.currentFromDate ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                            <br />
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "12pt",
                                                lineHeight: "18px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                To:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "12pt",
                                                  lineHeight: "18px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  data-ccp-parastyle="header"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.currentToDate ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={8}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "28px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "50.3404%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Telephone (Home):
                                              </span>
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                &nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.currentTelephone ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "middle",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "49.5393%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Mobile:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.currentMobile ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={9}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "28px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={4}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "707px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px -44px 0px 0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Email address:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.currentGmail ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={10}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "76px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={4}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "707px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                fontWeight: "bold",
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Criminal through Court record
                                                check
                                              </span>
                                            </span>
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                &nbsp;
                                              </span>
                                            </span>
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                fontWeight: "bold",
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Permanent Address:
                                              </span>
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                &nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.criminalCheckPermanentAddress ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <br />
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={11}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "80px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={4}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "707px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "12pt",
                                                lineHeight: "18px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Period of stay at&nbsp;
                                              </span>
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                permanent
                                              </span>
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                &nbsp;address:
                                              </span>
                                            </span>
                                            <br />
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "12pt",
                                                lineHeight: "18px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                From:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "12pt",
                                                  lineHeight: "18px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  data-ccp-parastyle="header"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.permanentFromDate ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                            <br />
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "12pt",
                                                lineHeight: "18px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                To:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "12pt",
                                                  lineHeight: "18px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  data-ccp-parastyle="header"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.permanentToDate ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "12pt",
                                                lineHeight: "18px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                data-ccp-parastyle="header"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                &nbsp; &nbsp; &nbsp; &nbsp;
                                                &nbsp; &nbsp; &nbsp; &nbsp;
                                                &nbsp; &nbsp; &nbsp; &nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW258233678 BCX8"
                                              data-ccp-props='{"201341983":0,"335559739":0,"335559740":240,"469777462":[4153,8306],"469777927":[0,0],"469777928":[0,0]}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "12pt",
                                                lineHeight: "18px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={12}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "28px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "50.3404%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Telephone (Home):
                                              </span>
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                &nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.permanentTelephone ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "middle",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "49.5393%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Mobile:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.permanentMobile ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW258233678 BCX8"
                                    aria-rowindex={13}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "28px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol LastRow SCXW258233678 BCX8"
                                      data-celllook={4369}
                                      colSpan={4}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "707px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW258233678 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW258233678 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW258233678 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px -44px 0px 0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              data-contrast="auto"
                                              lang="EN-US"
                                              className="TextRun SCXW258233678 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontVariantLigatures:
                                                  "none !important",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              <span
                                                className="NormalTextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                Email address:&nbsp;
                                              </span>
                                            </span>
                                            <span
                                              className="ContentControl SCXW258233678 BCX8"
                                              aria-label="Plain text content control"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                data-contrast="auto"
                                                lang="EN-US"
                                                className="TextRun SCXW258233678 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                  fontVariantLigatures:
                                                    "none !important",
                                                  fontSize: "11pt",
                                                  lineHeight: "18.3458px",
                                                  fontFamily:
                                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                }}
                                              >
                                                <span
                                                  className="NormalTextRun SCXW258233678 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  {formData.permanentGmail ||
                                                    "N/A"}
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div
                            className="OutlineElement Ltr SCXW258233678 BCX8"
                            style={{
                              WebkitTapHighlightColor: "transparent",
                              margin: "0px",
                              padding: "0px",
                              userSelect: "text",
                              clear: "both",
                              cursor: "text",
                              overflow: "visible",
                              position: "relative",
                              direction: "ltr",
                              color: "rgb(0, 0, 0)",
                              fontFamily:
                                '"Segoe UI", "Segoe UI Web", Arial, Verdana, sans-serif',
                              fontSize: "12px",
                              fontStyle: "normal",
                              fontVariantLigatures: "normal",
                              fontVariantCaps: "normal",
                              fontWeight: 400,
                              letterSpacing: "normal",
                              orphans: 2,
                              textAlign: "start",
                              textIndent: "0px",
                              textTransform: "none",
                              widows: 2,
                              wordSpacing: "0px",
                              WebkitTextStrokeWidth: "0px",
                              whiteSpace: "normal",
                              backgroundColor: "rgb(255, 255, 255)",
                              textDecorationThickness: "initial",
                              textDecorationStyle: "initial",
                              textDecorationColor: "initial",
                            }}
                          >
                            <p
                              className="Paragraph SCXW258233678 BCX8"
                              style={{
                                WebkitTapHighlightColor: "transparent",
                                margin: "0px 0px 10.6667px -60px",
                                padding: "0px",
                                userSelect: "text",
                                overflowWrap: "break-word",
                                whiteSpace: "pre-wrap",
                                fontWeight: "normal",
                                fontStyle: "normal",
                                verticalAlign: "baseline",
                                fontKerning: "none",
                                backgroundColor: "transparent",
                                color: "windowtext",
                                textAlign: "left",
                                textIndent: "60px",
                              }}
                            >
                              <br />
                            </p>
                          </div>
                          <div
                            className="OutlineElement Ltr SCXW258233678 BCX8"
                            style={{
                              WebkitTapHighlightColor: "transparent",
                              margin: "0px",
                              padding: "0px",
                              userSelect: "text",
                              clear: "both",
                              cursor: "text",
                              overflow: "visible",
                              position: "relative",
                              direction: "ltr",
                              color: "rgb(0, 0, 0)",
                              fontFamily:
                                '"Segoe UI", "Segoe UI Web", Arial, Verdana, sans-serif',
                              fontSize: "12px",
                              fontStyle: "normal",
                              fontVariantLigatures: "normal",
                              fontVariantCaps: "normal",
                              fontWeight: 400,
                              letterSpacing: "normal",
                              orphans: 2,
                              textAlign: "start",
                              textIndent: "0px",
                              textTransform: "none",
                              widows: 2,
                              wordSpacing: "0px",
                              WebkitTextStrokeWidth: "0px",
                              whiteSpace: "normal",
                              backgroundColor: "rgb(255, 255, 255)",
                              textDecorationThickness: "initial",
                              textDecorationStyle: "initial",
                              textDecorationColor: "initial",
                            }}
                          >
                            <div
                              style={{
                                textAlign: "start",

                                backgroundColor: "rgb(255, 255, 255)",
                                fontSize: "12px",
                              }}
                            >
                              <span
                                data-contrast="auto"
                                lang="EN-US"
                                className="TextRun SCXW244090819 BCX8"
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                  margin: "0px",
                                  padding: "0px",
                                  userSelect: "text",
                                  fontVariantLigatures: "none !important",

                                  fontStyle: "normal",
                                  fontVariantCaps: "normal",
                                  letterSpacing: "normal",
                                  orphans: 2,
                                  textAlign: "justify",
                                  textIndent: "0px",
                                  textTransform: "none",
                                  widows: 2,
                                  wordSpacing: "0px",
                                  WebkitTextStrokeWidth: "0px",
                                  whiteSpace: "pre-wrap",
                                  backgroundColor: "rgb(255, 255, 255)",
                                  textDecorationThickness: "initial",
                                  textDecorationStyle: "initial",
                                  textDecorationColor: "initial",
                                  fontSize: "11pt",
                                  lineHeight: "18.3458px",
                                  fontFamily:
                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                  fontWeight: "bold",
                                }}
                              >
                                <span
                                  className="NormalTextRun SCXW244090819 BCX8"
                                  style={{
                                    margin: "0px",
                                    padding: "0px",
                                    userSelect: "text",
                                    color: "#000000 !important",
                                  }}
                                >
                                  Employment Details –&nbsp;
                                </span>
                              </span>
                              <span
                                data-contrast="none"
                                lang="EN-US"
                                className="TextRun SCXW244090819 BCX8"
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                  margin: "0px",
                                  padding: "0px",
                                  userSelect: "text",
                                  fontVariantLigatures: "none !important",
                                  fontStyle: "normal",
                                  fontVariantCaps: "normal",
                                  letterSpacing: "normal",
                                  orphans: 2,
                                  textAlign: "justify",
                                  textIndent: "0px",
                                  textTransform: "none",
                                  widows: 2,
                                  wordSpacing: "0px",
                                  WebkitTextStrokeWidth: "0px",
                                  whiteSpace: "pre-wrap",
                                  backgroundColor: "rgb(255, 255, 255)",
                                  textDecorationThickness: "initial",
                                  textDecorationStyle: "initial",
                                  textDecorationColor: "initial",
                                  color: "rgb(255, 0, 0)",
                                  fontSize: "11pt",
                                  lineHeight: "18.3458px",
                                  fontFamily:
                                    '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                  fontWeight: "bold",
                                }}
                              >
                                <span
                                  className="NormalTextRun SCXW244090819 BCX8"
                                  style={{
                                    WebkitTapHighlightColor: "transparent",
                                    margin: "0px",
                                    padding: "0px",
                                    userSelect: "text",
                                  }}
                                >
                                  (Accepted resignation letter copy of current
                                  employer and relieving letter for all
                                  the&nbsp;
                                </span>
                                <span
                                  className="NormalTextRun SCXW244090819 BCX8"
                                  style={{
                                    WebkitTapHighlightColor: "transparent",
                                    margin: "0px",
                                    padding: "0px",
                                    userSelect: "text",
                                  }}
                                >
                                  previous
                                </span>
                                <span
                                  className="NormalTextRun SCXW244090819 BCX8"
                                  style={{
                                    WebkitTapHighlightColor: "transparent",
                                    margin: "0px",
                                    padding: "0px",
                                    userSelect: "text",
                                  }}
                                >
                                  &nbsp;employers to be attached)
                                </span>
                              </span>
                            </div>
                            <p>
                              <br />
                            </p>
                            {employmentHistory.map((val: any) => (
                              <table
                                className="Table Ltr TableWordWrap Locked SCXW13029922 BCX8"
                                border={1}
                                data-tablestyle="MsoNormalTable"
                                data-tablelook={480}
                                aria-rowcount={21}
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                  margin: "0px calc(0%)",
                                  padding: "0px",
                                  userSelect: "text",
                                  tableLayout: "fixed",
                                  width: "100%",
                                  borderCollapse: "collapse",
                                  emptyCells: "show",
                                  position: "relative",
                                  overflow: "visible",
                                  color: "rgb(0, 0, 0)",
                                  fontFamily:
                                    '"Segoe UI", "Segoe UI Web", Arial, Verdana, sans-serif',
                                  fontSize: "12px",
                                  fontStyle: "normal",
                                  fontVariantLigatures: "normal",
                                  fontVariantCaps: "normal",
                                  fontWeight: 400,
                                  letterSpacing: "normal",
                                  orphans: 2,
                                  textAlign: "start",
                                  textTransform: "none",
                                  widows: 2,
                                  wordSpacing: "0px",
                                  WebkitTextStrokeWidth: "0px",
                                  whiteSpace: "normal",
                                  background: "transparent",
                                  textDecorationThickness: "initial",
                                  textDecorationStyle: "initial",
                                  textDecorationColor: "initial",
                                  borderSpacing: "0px",
                                }}
                              >
                                <tbody
                                  className="SCXW13029922 BCX8"
                                  style={{
                                    WebkitTapHighlightColor: "transparent",
                                    margin: "0px",
                                    padding: "0px",
                                    userSelect: "text",
                                  }}
                                >
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={1}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstRow FirstCol LastCol AdvancedProofingLightMode ContextualSpellingLightMode SpellingErrorLightMode SimilarityReviewedBlack SimilarityUnreviewedLightMode AddInCritiqueRedLightMode AddInCritiqueGreenLightMode AddInCritiqueBlueLightMode AddInCritiqueLavenderLightMode AddInCritiqueBerryLightMode HighContrastShading SCXW13029922 BCX8"
                                      data-celllook={69905}
                                      colSpan={5}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "rgb(255, 255, 0)",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "748px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "8px 0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    color:
                                                      "windowtext !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    fontWeight: "bold",
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    {val.companyName || "N/A"} -{" "}
                                                    {val.position || "N/A"}
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={2}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "59px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "17.3908%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Company Name:
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      data-celllook={4369}
                                      colSpan={2}
                                      className="SCXW13029922 BCX8"
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3421%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.companyName || "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      data-celllook={4369}
                                      className="SCXW13029922 BCX8"
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "16.1354%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Position&nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Held &amp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;Dept
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "22.6602%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.position || "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={3}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "120px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "17.3908%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Address of the&nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Head office
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      data-celllook={4369}
                                      colSpan={2}
                                      className="SCXW13029922 BCX8"
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3421%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.headOfficeAddress ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <br />
                                          </p>
                                        </div>
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <br />
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      data-celllook={4369}
                                      className="SCXW13029922 BCX8"
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "16.1354%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Telephone no(s) of Head
                                                    office
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "22.6602%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.headOfficePhone ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={4}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "36px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "17.3908%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Address of&nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    the office
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;in&nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    which worked
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;(if different from the
                                                    head office)&nbsp;
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      data-celllook={4369}
                                      colSpan={2}
                                      className="SCXW13029922 BCX8"
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3421%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.branchOfficeAddress ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      data-celllook={4369}
                                      className="SCXW13029922 BCX8"
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "16.1354%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Telephone no(s) of Branch
                                                    office
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "22.6602%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.branchOfficePhone ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={5}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "57.3143%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Employment date:&nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    (Date
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    ,&nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Month,
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;Year)
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    From:&nbsp;
                                                  </span>
                                                </span>
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.employmentFrom ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp; &nbsp; &nbsp; &nbsp;
                                                    &nbsp; &nbsp; &nbsp; &nbsp;
                                                    &nbsp; &nbsp; &nbsp; &nbsp;
                                                    &nbsp; &nbsp; To:
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;
                                                  </span>
                                                </span>
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.employmentTo ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      data-celllook={4369}
                                      className="SCXW13029922 BCX8"
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "16.1354%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Employee code:
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "22.6602%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.employeeCode ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={6}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={5}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "748px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Whether employment is
                                                    temporary or permanent in
                                                    Nature &nbsp; - &nbsp;&nbsp;
                                                  </span>
                                                </span>
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.employmentNature ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={7}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={5}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "748px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Agency details&nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    (If
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;temporary or
                                                    Contractual)
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    -&nbsp;
                                                  </span>
                                                </span>
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.agencyDetails ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <br />
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={8}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={5}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "748px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Responsibilities:
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;
                                                  </span>
                                                </span>
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.responsibilities ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <br />
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={9}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Last drawn CTC P.A.:
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;
                                                  </span>
                                                </span>
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.lastCTC || "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Reason for leaving:
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    &nbsp;
                                                  </span>
                                                </span>
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.reasonForLeaving ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={10}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={5}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "748px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    fontWeight: "bold",
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    HR Details
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={11}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Name of the HR
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.hrName || "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={12}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Position of the HR
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.hrPosition || "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={13}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Landline No
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.hrLandline || "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={14}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Mobile no
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.hrMobile || "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={15}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Email Address
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.hrEmail || "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={16}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={5}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "748px",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    fontWeight: "bold",
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Reporting Authority Details
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={17}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Name of the&nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Authority Details
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.reportingAuthorityName ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={18}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Position of the&nbsp;
                                                  </span>
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Authority Details
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.reportingAuthorityPosition ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={19}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Landline No
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.reportingAuthorityLandline ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={20}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Mobile no
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.reportingAuthorityMobile ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr
                                    className="TableRow SCXW13029922 BCX8"
                                    aria-rowindex={21}
                                    style={{
                                      WebkitTapHighlightColor: "transparent",
                                      margin: "0px",
                                      padding: "0px",
                                      userSelect: "text",
                                      overflow: "visible",
                                      height: "31px",
                                    }}
                                  >
                                    <td
                                      className="FirstCol LastRow SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={2}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "39.3232%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  data-contrast="auto"
                                                  lang="EN-US"
                                                  className="TextRun SCXW13029922 BCX8"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                    fontVariantLigatures:
                                                      "none !important",
                                                    fontSize: "11pt",
                                                    lineHeight: "18.3458px",
                                                    fontFamily:
                                                      '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                  }}
                                                >
                                                  <span
                                                    className="NormalTextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                    }}
                                                  >
                                                    Email Address
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td
                                      className="LastCol LastRow SCXW13029922 BCX8"
                                      data-celllook={4369}
                                      colSpan={3}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                        margin: "0px",
                                        padding: "0px",
                                        userSelect: "text",
                                        overflow: "visible",
                                        verticalAlign: "top",
                                        position: "relative",
                                        backgroundColor: "transparent",
                                        backgroundClip: "padding-box",
                                        border: "1px solid",
                                        width: "58.9265%",
                                      }}
                                    >
                                      <div
                                        className="TableCellContent SCXW13029922 BCX8"
                                        style={{
                                          WebkitTapHighlightColor:
                                            "transparent",
                                          margin: "0px",
                                          padding: "0px 7px",
                                          userSelect: "text",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div
                                          className="OutlineElement Ltr SCXW13029922 BCX8"
                                          style={{
                                            WebkitTapHighlightColor:
                                              "transparent",
                                            margin: "0px",
                                            padding: "0px",
                                            userSelect: "text",
                                            clear: "both",
                                            cursor: "text",
                                            overflow: "visible",
                                            position: "relative",
                                            direction: "ltr",
                                          }}
                                        >
                                          <p
                                            className="Paragraph SCXW13029922 BCX8"
                                            style={{
                                              WebkitTapHighlightColor:
                                                "transparent",
                                              margin: "0px",
                                              padding: "0px",
                                              userSelect: "text",
                                              overflowWrap: "break-word",
                                              whiteSpace: "pre-wrap",
                                              fontWeight: "normal",
                                              fontStyle: "normal",
                                              verticalAlign: "baseline",
                                              fontKerning: "none",
                                              backgroundColor: "transparent",
                                              color: "windowtext",
                                              textAlign: "left",
                                              textIndent: "0px",
                                            }}
                                          >
                                            <span
                                              className="ContentControl SCXW13029922 BCX8"
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                              }}
                                            >
                                              <span
                                                className="ContentControl SCXW13029922 BCX8"
                                                style={{
                                                  WebkitTapHighlightColor:
                                                    "transparent",
                                                  margin: "0px",
                                                  padding: "0px",
                                                  userSelect: "text",
                                                }}
                                              >
                                                <span
                                                  className="ContentControl SCXW13029922 BCX8"
                                                  aria-label="Plain text content control"
                                                  style={{
                                                    WebkitTapHighlightColor:
                                                      "transparent",
                                                    margin: "0px",
                                                    padding: "0px",
                                                    userSelect: "text",
                                                  }}
                                                >
                                                  <span
                                                    data-contrast="auto"
                                                    lang="EN-US"
                                                    className="TextRun SCXW13029922 BCX8"
                                                    style={{
                                                      WebkitTapHighlightColor:
                                                        "transparent",
                                                      margin: "0px",
                                                      padding: "0px",
                                                      userSelect: "text",
                                                      fontVariantLigatures:
                                                        "none !important",
                                                      fontSize: "11pt",
                                                      lineHeight: "18.3458px",
                                                      fontFamily:
                                                        '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                                    }}
                                                  >
                                                    <span
                                                      className="NormalTextRun SCXW13029922 BCX8"
                                                      style={{
                                                        WebkitTapHighlightColor:
                                                          "transparent",
                                                        margin: "0px",
                                                        padding: "0px",
                                                        userSelect: "text",
                                                      }}
                                                    >
                                                      {val.reportingAuthorityEmail ||
                                                        "N/A"}
                                                    </span>
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                            <span
                                              className="EOP SCXW13029922 BCX8"
                                              data-ccp-props='{"201341983":0,"335559740":259}'
                                              style={{
                                                WebkitTapHighlightColor:
                                                  "transparent",
                                                margin: "0px",
                                                padding: "0px",
                                                userSelect: "text",
                                                fontSize: "11pt",
                                                lineHeight: "18.3458px",
                                                fontFamily:
                                                  '"Aptos Display", "Aptos Display_EmbeddedFont", "Aptos Display_MSFontService", sans-serif',
                                              }}
                                            >
                                              &nbsp;
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <Toaster toasterId={toastId} />
        </DrawerBody>
      </OverlayDrawer>
    </>
  );
};

export default BackgroundVerificationPDFDialog;
