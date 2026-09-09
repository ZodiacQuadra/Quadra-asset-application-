import { Badge, Body1Strong, Button, Caption1, Card, FluentProvider, Spinner, Subtitle2, Switch, Tab, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, TabList, Text, Toast, ToastBody, Toaster, ToastIntent, ToastTitle, useId, useToastController } from "@fluentui/react-components"
import { Add20Regular, Add24Regular, Building16Filled, Building16Regular, Building32Filled, CheckmarkCircle20Regular, ChevronDownRegular, ChevronUpRegular, ErrorCircle20Regular, LocalLanguage24Regular, Person12Filled } from "@fluentui/react-icons"
import { useEffect, useState } from "react"
import { CreateMappingForm } from "../Components/HrMapping/MappingModal"
import { createHrDepartmentMapping, getMappingData, HrMapping as HrMappingType, updateData } from "../../Services/HrMapping"
import { UserDetails } from "../../Services/Offboarding"
import { EntraDepartment } from "../../Services/Department"
import { useAuth } from "../../Auth/AuthProvider"
import CustomPagination from "../../Recruit/Components/CustomPagination"



interface SortConfig {
    key: keyof HrMappingType;
    direction: "asc" | "desc";
}

interface DataType {
    user: UserDetails | null,
    department: string | null,
    departments: EntraDepartment[],
    departmentName: string,
    accessType: string,
    isActive: boolean
}




const HrMapping = () => {
    const [openDialog, setOpenDialog] = useState(false)
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [sortedMapping, setSortedMapping] = useState<HrMappingType[]>([]);
    const [Data, setData] = useState<DataType>({
        user: null,
        department: "",
        departments: [],
        departmentName: "",
        accessType: "Primary",
        isActive: true,
    })
    const [paginationData, setPaginationData] = useState({
        currentPage: 1,
        totalPage: 1,
        limit: 10
    })
    const [TabState, setTabState] = useState<"Active" | "InActive">("Active")
    const toastId = useId();

    const [isLoading, setIsLoading] = useState(false)
    const [IsUpdating, setIsUpdating] = useState(false)

    const { dispatchToast } = useToastController(toastId);
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { accessToken } = useAuth()

    const showToast = (intent: ToastIntent, title: string, body?: string) => {
        dispatchToast(
            <Toast>
                <ToastTitle
                    media={
                        intent === "success" ? (
                            <CheckmarkCircle20Regular />
                        ) : (
                            <ErrorCircle20Regular />
                        )
                    }
                >
                    {title}
                </ToastTitle>
                {body && <ToastBody>{body}</ToastBody>}
            </Toast>,
            { intent, timeout: 5000 }
        );
    };

    const loadData = async (page: number, limit: number) => {
        if (accessToken) {
            try {
                setIsLoading(true)
                const response = await getMappingData(page, limit, accessToken, TabState)
                // console.log("response", response)
                // setSortedMapping(response.data)
                setSortedMapping(response.data)
                setPaginationData({
                    totalPage: response.pagination[0].TotalPages,
                    limit: response.pagination[0].PageSize,
                    currentPage: response.pagination[0].CurrentPage
                })
            }
            catch (error) {
                showToast("error", "Unable to fetch mapping data")
            }
            finally {
                setIsLoading(false)
            }
        }

    }


    useEffect(() => {
        loadData(paginationData.currentPage, paginationData.limit)
    }, [paginationData.currentPage, paginationData.limit, TabState])


    const onPageChnage = (page: number) => {
        setPaginationData((prevData) => ({
            ...prevData,
            currentPage: page
        }))
    }

    const onItemsPerPageChange = (limit: number) => {
        setPaginationData((prevData) => ({
            ...prevData,
            limit: limit
        }))
    }

    const isUserDetails = (value: UserDetails | string | boolean | null | EntraDepartment | EntraDepartment[]): value is UserDetails => {
        return typeof value === "object" && value !== null && !Array.isArray(value) && "email" in value;
    }

    const isEntraDepartment = (value: UserDetails | string | boolean | null | EntraDepartment | EntraDepartment[]): value is EntraDepartment => {
        return typeof value === "object" && value !== null && !Array.isArray(value) && "Id" in value && !("email" in value);
    }

    const isEntraDepartmentArray = (value: UserDetails | string | boolean | null | EntraDepartment | EntraDepartment[]): value is EntraDepartment[] => {
        return Array.isArray(value);
    }

    const handleDataChange = (field: string, value: UserDetails | string | boolean | null | EntraDepartment | EntraDepartment[]) => {
        if (field === "user" && isUserDetails(value)) {
            setData((prevValue) => ({
                ...prevValue,
                user: value // TypeScript knows value is UserDetails
            }))
        }
        else if (field === "departments" && isEntraDepartmentArray(value)) {
            setData((prevValue) => ({
                ...prevValue,
                departments: value
            }))
        }
        else if (field === "department" && isEntraDepartment(value)) {
            setData((prevValue) => ({
                ...prevValue,
                department: value.Id,
                departmentName: value.Name
            }))
        }
        else if (field === "accessType" && typeof value === "string") {
            setData((prevValue) => ({
                ...prevValue,
                accessType: value
            }))
        }
        else if (field === "isActive" && typeof value === "boolean") {
            setData((prevValue) => ({
                ...prevValue,
                isActive: value
            }))
        }
    }

    const handleSubmit = async () => {
        if (!Data.user || !Data.departments || Data.departments.length === 0 || !Data.accessType) {
            // console.log("data", Data)
            showToast("error", "Error", "Please fill all the required fields")
            return;
        }
        else {
            if (accessToken) {
                try {
                    setIsSubmitting(true)
                    // console.log("Submitting with departments:", Data.departments);
                    // Create mapping for each selected department
                    for (const department of Data.departments) {
                        // console.log("Creating mapping for department:", department);
                        const validatedData = {
                            ...Data,
                            user: Data.user,
                            department: department.Id,
                            departmentName: department.Name,
                            accessType: Data.accessType
                        };
                        await createHrDepartmentMapping(validatedData, accessToken)
                    }

                    showToast("success", "HR mapped successfully")
                    handleCloseDialog()
                    loadData(1, paginationData.limit)
                    setPaginationData((prevData) => (
                        {
                            ...prevData,
                            currentPage: 1
                        }
                    ))
                }
                catch (error) {
                    // console.log(error)
                    let message
                    if (typeof error === "string") {
                        message = error
                    }
                    else if (error instanceof Error) {
                        message = error.message
                    }
                    else {
                        message = "Unable to map user"
                    }
                    showToast("error", message)
                }
                finally {
                    setIsSubmitting(false)
                }
            }
            else {
                showToast("error", "Unable to extract access token")
            }

        }




    }

    const handleToggleSwitch = async (item: HrMappingType) => {
        // console.log("item", item)
        const modified = { ...item }
        modified["isActive"] = !modified["isActive"]

        if (accessToken) {
            try {
                setIsUpdating(true)
                const response = await updateData(modified, accessToken)

                // console.log("response", response)
                if (response && !response.success) {
                    showToast("error", "Unable to update data")
                    return
                }

                showToast("success", "Data updated successfully")
                loadData(paginationData.currentPage, paginationData.limit)
            }
            catch (error) {
                // console.log(error)
                let message
                if (typeof error === "string") {
                    message = error
                }
                else if (error instanceof Error) {
                    message = error.message
                }
                else {
                    message = "Unable to update data"
                }
                showToast("error", message)
            }
            finally {
                setIsUpdating(false)
            }
        }

    }

    const handleOpenDialog = () => {
        setOpenDialog(true)
    }

    const handleCloseDialog = () => {
        setOpenDialog(false)
        setData({
            user: null,
            department: "",
            departments: [],
            departmentName: "",
            accessType: "Primary",
            isActive: true,
        })
    }

    const handleSort = (key: keyof HrMappingType) => {
        let direction: "asc" | "desc" = "asc";
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === "asc"
        ) {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 h-full">
                <Spinner />
                <Body1Strong className="mt-2">Loading data...</Body1Strong>
            </div>
        );
    }

    return (
        <FluentProvider style={{ background: "transparent" }}>
            <div className="flex justify-between items-center pb-4">
                <div>
                    <Subtitle2 className="text-[#063762]">
                        HR Mapping
                    </Subtitle2>
                    <div>
                        <Caption1 className="text-gray-600">
                            Map HR to a particular department
                        </Caption1>
                    </div>
                </div>

                <div>
                    <Button
                        appearance="primary"
                        onClick={() => handleOpenDialog()}
                        shape="circular"
                        icon={
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                                <Add24Regular />
                            </div>
                        }
                        className=" hover:bg-indigo-700 shadow  !bg-white/50 !text-[#626262] border-1 !border-white"
                        disabled={false}
                    >
                        Create New
                    </Button>
                </div>
            </div>

            {/* Table */}

            <div className="mt-20">
                <div className="inline-flex rounded-lg bg-white/10 backdrop-blur-md p-1 border border-white/20 mb-2">
    <button
        className={`px-6 py-2 rounded-md transition-all duration-200 cursor-pointer ${
            TabState === "Active"
                ? "bg-white text-gray-900 shadow-lg"
                : "bg-gray-400/20 text-gray-600/80 hover:bg-gray-400/30 hover:text-gray-600"
        }`}
        onClick={() => setTabState("Active")}
    >
        Active
    </button>
    <button
        className={`px-6 py-2 rounded-md transition-all duration-200 cursor-pointer ${
            TabState === "InActive"
                ? "bg-white text-gray-900 shadow-lg"
                : "bg-gray-400/20 text-gray-600/80 hover:bg-gray-400/30 hover:text-gray-600"
        }`}
        onClick={() => setTabState("InActive")}
    >
        In Active
    </button>
</div>
                {sortedMapping.length > 0 ? (
                    <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !h-[50vh]">
                        <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 !h-[100%]">
                            <Table sortable className="w-full " >
                                <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                                    <TableRow className="border-b-2 border-gray-100">

                                        <TableHeaderCell
                                            className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                                            onClick={() => handleSort("department")}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Body1Strong className="text-gray-900">
                                                    Department
                                                </Body1Strong>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {sortConfig?.key === "department" &&
                                                        (sortConfig.direction === "asc" ? (
                                                            <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                                                        ) : (
                                                            <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                                                        ))}
                                                </div>
                                            </div>
                                        </TableHeaderCell>


                                        <TableHeaderCell
                                            className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                                            onClick={() => handleSort("name")}
                                        >
                                            <div className="flex items-center gap-2 ml-5">
                                                <Body1Strong className="text-gray-900">
                                                    HR Name
                                                </Body1Strong>

                                            </div>
                                        </TableHeaderCell>

                                        <TableHeaderCell
                                            className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                                            onClick={() => handleSort("type")}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Body1Strong className="text-gray-900">
                                                    Type
                                                </Body1Strong>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {sortConfig?.key === "type" &&
                                                        (sortConfig.direction === "asc" ? (
                                                            <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                                                        ) : (
                                                            <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                                                        ))}
                                                </div>
                                            </div>
                                        </TableHeaderCell>

                                        <TableHeaderCell
                                            className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                                            onClick={() => handleSort("isActive")}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Body1Strong className="text-gray-900">
                                                    Status
                                                </Body1Strong>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {sortConfig?.key === "isActive" &&
                                                        (sortConfig.direction === "asc" ? (
                                                            <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                                                        ) : (
                                                            <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                                                        ))}
                                                </div>
                                            </div>
                                        </TableHeaderCell>





                                        <TableHeaderCell className="!py-3 !px-3">
                                            <Body1Strong className="text-gray-900">
                                                Actions
                                            </Body1Strong>
                                        </TableHeaderCell>
                                    </TableRow>
                                </TableHeader>

                                <TableBody className="!min-h-[50vh]">
                                    {sortedMapping.map((item, index) => {

                                        return (
                                            <TableRow
                                                key={item.id}
                                                className={`hover:bg-purple-50/50 transition-all duration-200 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                                                    }`}
                                            >


                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building32Filled className="w-5 h-5 text-gray-600" />
                                                        <Text
                                                            size={200}
                                                            className="text-gray-700 font-medium"
                                                        >
                                                            {item.department}
                                                        </Text>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="px-6 !py-5">
                                                    <div className="flex items-center gap-3">
                                                        <Person12Filled className="w-5 h-5 text-gray-600" />
                                                        <div className="space-y-1 ml-2">
                                                            <Text className="font-semibold text-gray-900 leading-tight">
                                                                {item.name}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Text
                                                            size={200}
                                                            className="text-gray-700 font-medium"
                                                        >
                                                            {item.type}
                                                        </Text>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="px-6 py-4">
                                                    <Badge appearance="tint" color={item.isActive ? "success" : "warning"}>{item.isActive ? "Active" : "In Active"}</Badge>
                                                </TableCell>


                                                <TableCell>
                                                    <Switch disabled={IsUpdating} onChange={() => handleToggleSwitch(item)} checked={item.isActive} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer */}
                        {sortedMapping.length > 0 && (
                            <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
                                <div className="flex items-center justify-between">
                                    <Caption1 className="text-gray-600 font-medium">
                                        Showing {sortedMapping.length} {" "}
                                        records
                                    </Caption1>

                                    <CustomPagination
                                        currentPage={paginationData.currentPage}
                                        totalPages={paginationData.totalPage}
                                        itemsPerPage={paginationData.limit}
                                        onPageChange={onPageChnage}
                                        onItemsPerPageChange={onItemsPerPageChange}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>
                ) : (
                    <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                            <LocalLanguage24Regular className="w-10 h-10 text-purple-600" />
                        </div>
                        <Subtitle2 className="mb-3 text-gray-700">
                            No mapping found
                        </Subtitle2>
                        <div className="text-center">
                            <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">

                            </Text>
                        </div>

                        <Button
                            appearance="primary"
                            onClick={() => handleOpenDialog()}
                            className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 bg-purple-600 hover:bg-purple-700"
                            icon={<Add20Regular />}
                        >
                            Create your first mapping
                        </Button>

                    </div>
                )}
            </div>

            <CreateMappingForm
                open={openDialog}
                handleClose={handleCloseDialog}
                data={Data}
                handleDataChange={handleDataChange}
                isSubmitting={isSubmitting}
                handleSubmit={handleSubmit}
            />

            <Toaster toasterId={toastId} />
        </FluentProvider>
    )
}


export default HrMapping