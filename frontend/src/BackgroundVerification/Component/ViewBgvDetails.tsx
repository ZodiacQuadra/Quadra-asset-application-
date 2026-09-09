import { Avatar, Caption1, Card, CardHeader, Subtitle1 } from "@fluentui/react-components";
import { Briefcase20Regular, Calendar20Regular, CheckmarkCircle48Regular, Document20Regular, Location20Regular, Person20Regular } from "@fluentui/react-icons";

interface ViewBgvDetailsProps {
    firstName: string;
    lastName: string;
    emailID: string;
    fatherName: string;
    gender: string;
    maritalStatus: string;
    dateOfBirth: Date | undefined;
    nationality: string;
    employeeCode: string;
    experienceLevel: string;
    gmailAddress: string;
    criminalCheckCurrentAddress: string;
    currentFromDate: Date | undefined;
    currentToDate: Date | undefined;
    currentTelephone: string;
    currentMobile: string;
    permanentAddressSame: boolean;
    criminalCheckPermanentAddress: string;
    permanentFromDate: Date | undefined;
    permanentToDate: Date | undefined;
    permanentTelephone: string;
    permanentMobile: string;
    currentGmail: string;
    permanentGmail: string;
    year: string;
}

const ViewBgvDetails: React.FC<{ data: ViewBgvDetailsProps }> = (props: { data: ViewBgvDetailsProps }) => {

    const personalDetails = [
        { label: "First Name", value: props.data.firstName },
        { label: "Last Name", value: props.data.lastName },
        { label: "Father's Name", value: props.data.fatherName },
        { label: "Gender", value: props.data.gender },
        { label: "Marital Status", value: props.data.maritalStatus },
        { label: "Date of Birth", value: new Date(props.data.dateOfBirth || "").toLocaleDateString() },
        { label: "Nationality", value: props.data.nationality },
        { label: "Employee Code", value: props.data.employeeCode ? props.data.employeeCode : "N/A" },
        { label: "Email Address", value: props.data.emailID ? props.data.emailID : "N/A" },
    ]

    const addressDetails = [
        { label: "Address", value: props.data.criminalCheckCurrentAddress },
        { label: "From Date", value: new Date(props.data.currentFromDate || "").toLocaleDateString() },
        { label: "To Date", value: new Date(props.data.currentToDate || "").toLocaleDateString() },
        { label: "Telephone", value: props.data.currentTelephone },
        { label: "Mobile", value: props.data.currentMobile },
    ]

    const permanentAddressDetails = [
        { label: "Address", value: props.data.criminalCheckPermanentAddress },
        { label: "From Date", value: new Date(props.data.permanentFromDate || "").toLocaleDateString() },
        { label: "To Date", value: new Date(props.data.permanentToDate || "").toLocaleDateString() },
        { label: "Telephone", value: props.data.permanentTelephone },
        { label: "Mobile", value: props.data.permanentMobile },
    ]



    // console.log("values for viewing", props.data);
    return (
        <div className="min-h-[40vh] h-full overflow-y-auto p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-1 border-gray-200 rounded-xl min-h-[10vh] p-4 flex flex-col justify-between">
                    <div className="flex gap-3 items-center">
                        <Avatar
                            icon={<Person20Regular />}
                            color="steel"
                            size={32}
                        />
                        <div className="flex flex-col justify-between">
                            <Caption1 className="!text-xs !text-gray-500">Employee</Caption1>
                            <Subtitle1 className="!text-sm !font-semibold">{props.data.firstName} {props.data.lastName}</Subtitle1>
                        </div>

                    </div>
                    <div className="flex justify-between mt-4">
                        <div className="flex gap-2 items-center">
                            <Caption1 className="!text-xs !text-gray-500">Code:</Caption1>
                            <Subtitle1 className="!text-sm !font-semibold">{props.data.employeeCode ? props.data.employeeCode : "N/A"}</Subtitle1>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Caption1 className="!text-xs !text-gray-500">Job Type:</Caption1>
                            <Subtitle1 className="!text-sm !font-semibold">{props.data.experienceLevel}</Subtitle1>
                        </div>
                    </div>
                </div>

                <div className="border-1 border-gray-200 rounded-xl min-h-[10vh] p-4 flex flex-col justify-between">
                    <div className="flex gap-3 items-center">
                        <Avatar
                            icon={<Document20Regular />}
                            color="forest"
                            size={32}
                        />
                        <div className="flex flex-col justify-between">
                            <Caption1 className="!text-xs !text-gray-500">Documents</Caption1>
                            <Subtitle1 className="!text-sm !font-semibold">8/10</Subtitle1>
                        </div>

                    </div>
                    <div className="flex justify-between mt-4">
                        <div className="flex gap-2 items-center">
                            <Caption1 className="!text-xs !text-gray-500">Uploaded:</Caption1>
                            <Subtitle1 className="!text-sm !font-semibold !text-green-700">12 files</Subtitle1>
                        </div>

                    </div>
                </div>

                <div className="border-1 border-gray-200 rounded-xl min-h-[10vh] p-4 flex flex-col justify-between">
                    <div className="flex gap-3 items-center">
                        <Avatar
                            icon={<Calendar20Regular />}
                            color="lavender"
                            size={32}
                        />
                        <div className="flex flex-col justify-between">
                            <Caption1 className="!text-xs !text-gray-500">Submitted</Caption1>
                            <Subtitle1 className="!text-sm !font-semibold">Oct 28,2025</Subtitle1>
                        </div>

                    </div>
                    <div className="flex justify-between mt-4">
                        <div className="flex gap-2 items-center">
                            <Caption1 className="!text-xs !text-gray-500">Status:</Caption1>
                            <Subtitle1 className="!text-sm !font-semibold">Pending</Subtitle1>
                        </div>

                    </div>
                </div>
            </div>

            <div className="w-full mt-5">
                <Card className="!p-0 !rounded-lg !shadow-sm !border-b-1 !border-[#E5E7EB]">
                    <div className="flex gap-2 !bg-[#E9ECFF] min-h-[60px] items-center px-4 !border-2 !border-[#E5E7EB]">
                        <div className="flex gap-3 items-center">
                            <Avatar
                                icon={<Person20Regular />}
                                color="blue"
                                size={32}
                            />
                            <Subtitle1 className="!font-semibold !text-sm !text-gray-700">Personal Details</Subtitle1>
                        </div>

                    </div>

                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 justify-between">
                        {
                            personalDetails.map((detail) => (
                                <div key={detail.label} className="flex flex-col gap-2 mb-4">
                                    <Caption1 className="!text-xs !text-gray-500">{detail.label}</Caption1>
                                    <Subtitle1 className="!text-sm !font-semibold">{detail.value}</Subtitle1>
                                </div>
                            ))
                        }
                    </div>




                </Card>


            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 mt-5 gap-4">
                <Card className="!p-0 !rounded-lg !shadow-sm !border-b-1 !border-[#E5E7EB]">
                    <div className="flex gap-2 !bg-[#E9ECFF] min-h-[60px] items-center px-4 !border-2 !border-[#E5E7EB]">
                        <div className="flex gap-3 items-center">
                            <Avatar
                                icon={<Location20Regular />}
                                color="blue"
                                size={32}
                            />
                            <Subtitle1 className="!font-semibold !text-sm !text-gray-700">Current Address</Subtitle1>
                        </div>

                    </div>

                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 justify-between">
                        {
                            addressDetails.map((detail) => (
                                <div key={detail.label} className="flex flex-col gap-2 mb-4">
                                    <Caption1 className="!text-xs !text-gray-500">{detail.label}</Caption1>
                                    <Subtitle1 className="!text-sm !font-semibold">{detail.value}</Subtitle1>
                                </div>
                            ))
                        }
                    </div>




                </Card>

                <Card className="!p-0 !rounded-lg !shadow-sm !border-2 !border-[#E5E7EB]">
                    <div className="flex gap-2 !bg-[#E9ECFF] min-h-[60px] items-center p-4 !border-b-1 !border-[#E5E7EB]">
                        <div className="flex gap-3 items-center">
                            <Avatar
                                icon={<Location20Regular />}
                                color="blue"
                                size={32}
                            />
                            <Subtitle1 className="!font-semibold !text-sm !text-gray-700">Permanent Address</Subtitle1>
                        </div>

                    </div>

                    {
                        props.data.permanentAddressSame ?
                            <div className="h-full w-full flex justify-center items-center">
                                <div className="flex flex-col gap-2 justify-center items-center">
                                    <Avatar
                                        icon={<CheckmarkCircle48Regular />}
                                        color="steel"
                                        size={64}
                                    />
                                    <Subtitle1 className="!font-semibold !text-sm !text-gray-700">Same as Current Address</Subtitle1>
                                    <Caption1 className="!text-xs !text-gray-400">Permanent address matches current address</Caption1>
                                </div>
                            </div>
                            :
                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 justify-between">


                                {permanentAddressDetails.map((detail) => (
                                    <div key={detail.label} className="flex flex-col gap-2 mb-4">
                                        <Caption1 className="!text-xs !text-gray-500">{detail.label}</Caption1>
                                        <Subtitle1 className="!text-sm !font-semibold">{detail.value}</Subtitle1>
                                    </div>
                                ))
                                }
                            </div>
                    }

                </Card>
            </div>

            <div className="grid grid-cols-1 mt-5">
                <Card className="!p-0 !rounded-lg !shadow-sm !border-2 !border-[#E5E7EB]">
                    <div className="flex gap-2 !bg-[#E9ECFF] min-h-[60px] items-center p-4 !border-b-1 !border-[#E5E7EB]">
                        <div className="flex gap-3 items-center">
                            <Avatar
                                icon={<Briefcase20Regular />}
                                color="blue"
                                size={32}
                            />
                            <Subtitle1 className="!font-semibold !text-sm !text-gray-700">Employment Details</Subtitle1>
                        </div>

                    </div>

                </Card>
                </div>
        </div>
    );
};
export default ViewBgvDetails;