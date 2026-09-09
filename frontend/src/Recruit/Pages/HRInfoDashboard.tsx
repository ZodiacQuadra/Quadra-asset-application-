import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Text,
    Avatar,
    Drawer,
    DrawerHeader,
    DrawerBody,
    Button,
    Spinner
} from "@fluentui/react-components";
import { getAdminDashboardData, sendEmailToManagement } from '../../Services/JDRequests';
import { useAuth } from '../../Auth/AuthProvider';
import { fetchProfilePicture } from '../../Services/GraphAPI';
import {
    Briefcase20Regular,
    Calendar20Regular,
    ApprovalsApp20Regular,
    People20Regular,
    ArrowUpload20Regular,
    Info20Regular,
    Dismiss24Regular,
    CalendarLtr20Regular,
    Mail20Regular
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

// Date filter types
type DateFilterType = 'today' | 'week' | 'month' | 'quarter' | 'year';
type CustomDateRange = {
    startDate: Date | null;
    endDate: Date | null;
};

const HRInfoDashboard = () => {
    const [totalJdRequests, setTotalJdRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentUser, accessToken, refreshToken }: any = useAuth();
    const calendarRef = useRef<HTMLDivElement>(null);
    const [HRData,setHRData]=useState<any>({})
    const [scheduledInterview, setScheduledInterview] = useState<any[]>([]);
    const [completedInterview, setCompletedInterview] = useState<any[]>([]);
    const [hiredCandidate, setHiredCandidate] = useState<any[]>([]);
    const [materialSharedCandidate, setMaterialSharedCandidate] = useState<any[]>([]);
    const [pendingAction, setPendingAction] = useState<any[]>([]);
    const [hrApplicants, setHrApplicants] = useState<any[]>([]);
    const [IsSendingEmail, setIsSendingEmail] = useState(false);
    // Profile state
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState<any[]>([]);
    const [drawerTitle, setDrawerTitle] = useState('');
    const [drawerType, setDrawerType] = useState('');

    // Date filter states
    const [dateFilterType, setDateFilterType] = useState<DateFilterType>('today');
    const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
        startDate: new Date(),
        endDate: new Date()
    });
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const navigate = useNavigate()
    
    // Add this useEffect to handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(event.target as Node) &&
                showCalendar
            ) {
                setShowCalendar(false);
            }
        };

        // Add event listener when calendar is shown
        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendar]);

    // Fetch profile picture
    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser?.userID || !accessToken) return;

            setProfileLoading(true);
            try {
                const pictureUrl = await fetchProfilePicture(currentUser.userID, accessToken);
                setProfilePicture(pictureUrl);
            } catch (error) {
                console.error('Failed to load profile picture:', error);
            } finally {
                setProfileLoading(false);
            }
        };

        fetchProfile();
    }, [currentUser?.userID, accessToken]);

    // Get date range based on filter type and selected date
    const getDateRange = (): { startDate: Date | null; endDate: Date | null } => {
        const baseDate = new Date(selectedDate);
        baseDate.setHours(0, 0, 0, 0);

        switch (dateFilterType) {
            case 'today':
                const startOfDay = new Date(baseDate);
                const endOfDay = new Date(baseDate);
                endOfDay.setDate(endOfDay.getDate() + 1);
                return { startDate: startOfDay, endDate: endOfDay };

            case 'week':
                const startOfWeek = new Date(baseDate);
                startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 7);
                return { startDate: startOfWeek, endDate: endOfWeek };

            case 'month':
                const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
                const endOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
                return { startDate: startOfMonth, endDate: endOfMonth };

            case 'quarter':
                const quarter = Math.floor(baseDate.getMonth() / 3);
                const startOfQuarter = new Date(baseDate.getFullYear(), quarter * 3, 1);
                const endOfQuarter = new Date(baseDate.getFullYear(), quarter * 3 + 3, 1);
                return { startDate: startOfQuarter, endDate: endOfQuarter };

            case 'year':
                const startOfYear = new Date(baseDate.getFullYear(), 0, 1);
                const endOfYear = new Date(baseDate.getFullYear() + 1, 0, 1);
                return { startDate: startOfYear, endDate: endOfYear };

            default:
                const defaultStart = new Date(baseDate);
                const defaultEnd = new Date(baseDate);
                defaultEnd.setDate(defaultEnd.getDate() + 1);
                return { startDate: defaultStart, endDate: defaultEnd };
        }
    };

    // Handle date filter change (using tabs)
    const handleDateFilterChange = (value: DateFilterType) => {
        setDateFilterType(value);
        setSelectedDate(new Date());
    };

    // Handle calendar date selection
    const handleCalendarDateSelect = (date: Date) => {
        setSelectedDate(date);
        setShowCalendar(false);
    };

    // Fetch dashboard data using the same SP as AdminDashboard, scoped to current user
    const fetchDashboardStats = useCallback(async () => {
        if (!accessToken || !currentUser) return;

        const userId = currentUser.userID || currentUser.id;
        setLoading(true);
        try {
            const response = await getAdminDashboardData(accessToken, {
                selectedUserId: userId,
                dateFilterType,
                selectedDate
            });

            if (response.success && response.data) {
                const data = response.data;
                setHRData(data.hrTeamMembers || [])
                setScheduledInterview(data.dashboardStats?.scheduledInterviews || []);
                setCompletedInterview(data.dashboardStats?.completedInterviews || []);
                setHiredCandidate(data.dashboardStats?.hiredCandidates || []);
                setMaterialSharedCandidate(data.dashboardStats?.materialSharedCandidates || []);
                setPendingAction(data.dashboardStats?.pendingActionInterviews || []);
                setHrApplicants(data.dashboardStats?.totalApplicants || []);
                setTotalJdRequests(data.allData?.jdRequests || []);
            } else {
                console.error('Failed to fetch HR dashboard data:', response.error);
            }
        } catch (error) {
            console.error('Error fetching HR dashboard data:', error);
        } finally {
            setLoading(false);
            localStorage.removeItem("inductionPagination");
        }
    }, [accessToken, currentUser, dateFilterType, selectedDate]);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    const handleCardClick = (type: string, data: any[], title: string) => {
        setDrawerType(type);
        setDrawerData(data);
        setDrawerTitle(title);
        setIsDrawerOpen(true);
    };

    const handleJobCode = (id: any) => {
        const req = totalJdRequests.find((item: any) =>
            item?.JobID === id || item?.ID === id || item?.JobPostingID === id
        );
        return req?.JDCode || req?.JobCode || req?.Code || 'N/A';
    }

      const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "N/A", time: "N/A" };

    try {
      const cleanDateString = dateString.replace("Z", "");
      const date = new Date(cleanDateString);

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();

      const istDate = new Date(year, month, day, hour, minute);

      const now = new Date();
      const isToday = istDate.toDateString() === now.toDateString();
      const isTomorrow =
        new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() ===
        istDate.toDateString();

      let dateDisplay = istDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      if (isToday) dateDisplay = "Today";
      else if (isTomorrow) dateDisplay = "Tomorrow";

      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");

      return {
        date: dateDisplay,
        time: `${displayHours}:${displayMinutes} ${ampm}`,
        isUpcoming: istDate > now,
        isPast: istDate < now,
      };
    } catch (error) {
      console.warn("Invalid date format:", dateString);
      return {
        date: "Invalid Date",
        time: "",
        isUpcoming: false,
        isPast: false,
      };
    }
  };
    // Date filter display text
    const getDateFilterDisplay = () => {
        const { startDate, endDate } = getDateRange();

        if (!startDate || !endDate) return 'Select Date';

        const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        if (dateFilterType === 'today') {
            return formatDate(startDate);
        }
        if (dateFilterType === 'week') {
            const weekEnd = new Date(endDate);
            weekEnd.setDate(weekEnd.getDate() - 1);
            return `${formatDate(startDate)} - ${formatDate(weekEnd)}`;
        }
        if (dateFilterType === 'month') {
            return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        if (dateFilterType === 'quarter') {
            const quarter = Math.floor(startDate.getMonth() / 3) + 1;
            return `Q${quarter} ${startDate.getFullYear()}`;
        }
        if (dateFilterType === 'year') {
            return startDate.getFullYear().toString();
        }

        return formatDate(startDate);
    };

    // Get filtered active jobs count
    const getActiveJobsCount = () => {
        return HRData && Array.isArray(HRData) && HRData.length > 0 ? HRData[0].ActiveJobCount : 0;
    };

    // Render calendar based on filter type
    const renderCalendar = () => {
        const currentMonth = selectedDate.getMonth();
        const currentYear = selectedDate.getFullYear();

        if (dateFilterType === 'today') {
            // Daily calendar - standard month view with day selection
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const days = [];

            for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="p-2"></div>);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(currentYear, currentMonth, day);
                const isSelected = selectedDate.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();

                days.push(
                    <button
                        key={day}
                        onClick={() => handleCalendarDateSelect(date)}
                        className={`p-2 text-sm rounded hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white hover:bg-blue-700' : ''
                            } ${isToday && !isSelected ? 'border border-blue-600' : ''}`}
                    >
                        {day}
                    </button>
                );
            }

            return (
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ‹
                        </button>
                        <Text weight="semibold">
                            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <button
                            onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ›
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs font-semibold p-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">{days}</div>
                </div>
            );
        } else if (dateFilterType === 'week') {
            // Weekly calendar - show weeks of the month
            const weeks = [];
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

            let currentWeekStart = new Date(startOfMonth);
            currentWeekStart.setDate(1 - startOfMonth.getDay());

            while (currentWeekStart <= endOfMonth) {
                const weekStart = new Date(currentWeekStart);
                const weekEnd = new Date(currentWeekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                const selectedWeekStart = new Date(selectedDate);
                selectedWeekStart.setDate(selectedDate.getDate() - selectedDate.getDay());

                const isSelected = weekStart.toDateString() === selectedWeekStart.toDateString();

                weeks.push(
                    <button
                        key={weekStart.toISOString()}
                        onClick={() => handleCalendarDateSelect(weekStart)}
                        className={`p-3 text-sm rounded border hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white border-blue-600 hover:bg-blue-700' : 'border-gray-200'
                            }`}
                    >
                        <div className="font-semibold">Week {Math.ceil((weekStart.getDate() + startOfMonth.getDay()) / 7)}</div>
                        <div className="text-xs mt-1">
                            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    </button>
                );

                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            }

            return (
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ‹
                        </button>
                        <Text weight="semibold">
                            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <button
                            onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ›
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">{weeks}</div>
                </div>
            );
        } else if (dateFilterType === 'month') {
            // Monthly calendar - show all months of the year
            const months = [];
            for (let month = 0; month < 12; month++) {
                const monthDate = new Date(currentYear, month, 1);
                const isSelected = selectedDate.getMonth() === month && selectedDate.getFullYear() === currentYear;

                months.push(
                    <button
                        key={month}
                        onClick={() => handleCalendarDateSelect(monthDate)}
                        className={`p-3 text-sm rounded border hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white border-blue-600 hover:bg-blue-700' : 'border-gray-200'
                            }`}
                    >
                        {monthDate.toLocaleDateString('en-US', { month: 'long' })}
                    </button>
                );
            }

            return (
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => setSelectedDate(new Date(currentYear - 1, 0, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ‹
                        </button>
                        <Text weight="semibold">{currentYear}</Text>
                        <button
                            onClick={() => setSelectedDate(new Date(currentYear + 1, 0, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ›
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">{months}</div>
                </div>
            );
        } else if (dateFilterType === 'quarter') {
            // Quarterly calendar - show all quarters of the year
            const quarters = [
                { label: 'Q1', months: 'Jan - Mar', month: 0 },
                { label: 'Q2', months: 'Apr - Jun', month: 3 },
                { label: 'Q3', months: 'Jul - Sep', month: 6 },
                { label: 'Q4', months: 'Oct - Dec', month: 9 }
            ];

            return (
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => setSelectedDate(new Date(currentYear - 1, 0, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ‹
                        </button>
                        <Text weight="semibold">{currentYear}</Text>
                        <button
                            onClick={() => setSelectedDate(new Date(currentYear + 1, 0, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ›
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {quarters.map((quarter) => {
                            const quarterDate = new Date(currentYear, quarter.month, 1);
                            const selectedQuarter = Math.floor(selectedDate.getMonth() / 3);
                            const currentQuarterIndex = Math.floor(quarter.month / 3);
                            const isSelected = selectedQuarter === currentQuarterIndex && selectedDate.getFullYear() === currentYear;

                            return (
                                <button
                                    key={quarter.label}
                                    onClick={() => handleCalendarDateSelect(quarterDate)}
                                    className={`p-4 text-sm rounded border hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white border-blue-600 hover:bg-blue-700' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="font-semibold text-lg">{quarter.label}</div>
                                    <div className="text-xs mt-1">{quarter.months}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        } else if (dateFilterType === 'year') {
            // Annual calendar - show years
            const startYear = Math.floor(currentYear / 10) * 10;
            const years = [];

            for (let year = startYear; year < startYear + 12; year++) {
                const yearDate = new Date(year, 0, 1);
                const isSelected = selectedDate.getFullYear() === year;

                years.push(
                    <button
                        key={year}
                        onClick={() => handleCalendarDateSelect(yearDate)}
                        className={`p-3 text-sm rounded border hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white border-blue-600 hover:bg-blue-700' : 'border-gray-200'
                            }`}
                    >
                        {year}
                    </button>
                );
            }

            return (
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => setSelectedDate(new Date(startYear - 10, 0, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ‹
                        </button>
                        <Text weight="semibold">{startYear} - {startYear + 11}</Text>
                        <button
                            onClick={() => setSelectedDate(new Date(startYear + 10, 0, 1))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ›
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">{years}</div>
                </div>
            );
        }

        return null;
    };

    const renderDrawerContent = () => {
        if (drawerData.length === 0) {
            return (
                <div className='flex items-center justify-center h-full'>
                    <Text>No data available for the selected filters</Text>
                </div>
            );
        }

        switch (drawerType) {
            case 'scheduled':
            case 'completed':
            case 'pending':
                return (
                    <div className='overflow-x-auto'>
                        <table className='w-full border-collapse'>
                            <thead>
                                <tr className='bg-gray-100 border-b'>
                                    <th className='p-3 text-left text-sm font-semibold'>Applicant Name</th>
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Email</th> */}
                                    <th className='p-3 text-left text-sm font-semibold'>Job Role</th>
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Interview Title</th> */}
                                    <th className='p-3 text-left text-sm font-semibold'>Scheduled Date</th>
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Created Date</th> */}
                                    <th className='p-3 text-left text-sm font-semibold'>Interviewers</th>
                                    <th className='p-3 text-left text-sm font-semibold'>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drawerData.map((item: any, index: number) => (
                                    <tr key={item.InterviewID || index} className='border-b hover:bg-gray-50'>
                                        <td className='p-3 text-sm'>
                                            {item.FirstName} {item.LastName}
                                        </td>
                                        {/* <td className='p-3 text-sm'>{item.Email || 'N/A'}</td> */}
                                        <td className='p-3 text-sm'>{item.JobRole || 'N/A'}</td>
                                        {/* <td className='p-3 text-sm'>{item.InterviewTitle || 'N/A'}</td> */}
                                        <td className='p-3 text-sm'>{formatDateTime(item.ScheduledDateTime).date+" | "+formatDateTime(item.ScheduledDateTime).time}</td>
                                        {/* <td className='p-3 text-sm'>{formatDateTime(item.CreatedAt)}</td> */}
                                        <td className='p-3 text-sm'>
                                            {item.interviewers && item.interviewers.length > 0 ? (
                                                <div className='flex flex-col gap-1'>
                                                    {item.interviewers.map((interviewer: any, idx: number) => (
                                                        <div key={idx} className='flex items-center gap-2'>
                                                            <Avatar
                                                                name={interviewer.displayName}
                                                                size={24}
                                                            />
                                                            <Text size={200}>
                                                                {interviewer.displayName}
                                                                {interviewer.isPrimary && ' (Primary)'}
                                                            </Text>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                'N/A'
                                            )}
                                        </td>
                                        <td className='p-3 text-sm'>
                                            <span className={`px-2 py-1 rounded text-xs ${item.InterviewStatus === 'Completed'
                                                ? 'bg-green-100 text-green-800'
                                                : item.InterviewStatus === 'Scheduled'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : item.InterviewStatus === 'Cancelled'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.InterviewStatus || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'hired':
            case 'material':
                return (
                    <div className='overflow-x-auto'>
                        <table className='w-full border-collapse'>
                            <thead>
                                <tr className='bg-gray-100 border-b'>
                                    <th className='p-3 text-left text-sm font-semibold'>Applicant Name</th>
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Email</th> */}
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Phone</th> */}
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Job Code</th> */}
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Created Date</th> */}
                                    <th className='p-3 text-left text-sm font-semibold'>Level</th>
                                    <th className='p-3 text-left text-sm font-semibold'>Status</th>
                                    {drawerType === 'material' && (
                                        <th className='p-3 text-left text-sm font-semibold'>Material Shared</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {drawerData.map((item: any, index: number) => (
                                    <tr key={item.ApplicantID || index} className='border-b hover:bg-gray-50'>
                                        <td className='p-3 text-sm'>
                                            {item.FirstName} {item.LastName}
                                        </td>
                                        {/* <td className='p-3 text-sm'>{item.Email || 'N/A'}</td>
                                        <td className='p-3 text-sm'>{item.Phone || 'N/A'}</td>
                                        <td className='p-3 text-sm'>{handleJobCode(item.JobPostingID) || 'N/A'}</td>
                                        <td className='p-3 text-sm'>{formatDateTime(item.CreatedAt)}</td> */}
                                        <td className='p-3 text-sm'>{item.Experienced ? 'Experienced' : 'Fresher'}</td>
                                        <td className='p-3 text-sm'>
                                            <span className='px-2 py-1 rounded text-xs bg-green-100 text-green-800'>
                                                {item.Status || 'N/A'}
                                            </span>
                                        </td>
                                        {drawerType === 'material' && (
                                            <td className='p-3 text-sm'>
                                                {item.IsMaterialShared ? '✓ Yes' : '✗ No'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return <Text>No content available</Text>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 h-full">
                <Spinner />
                <Text>Loading HR Dashboard...</Text>
            </div>
        );
    }

    const checkSessionExpired = async () => {
      try {
        const val = await refreshToken();
        if (!val) {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          sessionStorage.clear();
          navigate("/");
        }
      } catch (e) {
        console.warn("Error during session check", e);
        alert("An error occurred. Please log in again.");
        localStorage.clear();
        sessionStorage.clear();
        navigate("/");
      }
    }

    const handleShareReport = async() => {
        const userId = currentUser?.userID || currentUser?.id || 'unknown-user';
        await checkSessionExpired()
        try{
            setIsSendingEmail(true);
            const response = await sendEmailToManagement({
                selectedUserId: userId,
                dateFilterType: dateFilterType,
                selectedDate: selectedDate,
                accessToken
            })
            if(response && response.success){
                alert('Report shared successfully with management!');
            } else {
                alert('Failed to share report. Please try again later.');
            }
        }
        catch(error){
            console.error('Error sharing report:', error);
            alert('An error occurred while sharing the report. Please try again later.');
        }
        finally{
            setIsSendingEmail(false);
        }
    }

    return (
        <div className='flex flex-col items-start justify-start gap-3 h-[100%] w-[100%]'>
            <div className='flex w-[100%] justify-between items-center'>
                <p style={{ fontSize: 'large', fontWeight: 'bold' }}>My Overview</p>

                {/* Date Filters as Tabs */}
                <div className='flex gap-2 items-center relative'>
                    {/* Calendar Toggle Button */}
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        style={{ border: '1px solid #ffffff', fontSize: 'large' }}
                        className={`cursor-pointer px-4 py-4 rounded-[30px] ${showCalendar ? 'bg-[#0C59A4] text-white' : 'bg-[#ffffff56] text-gray-700'} hover:shadow-md transition-all flex items-center gap-2`}
                    >
                        <CalendarLtr20Regular />
                        <span className="text-sm font-medium">{getDateFilterDisplay()}</span>
                    </button>
                    {/* Calendar Dropdown */}
                    {showCalendar && (
                        <div
                            ref={calendarRef} // Add ref
                            className='absolute top-[98%] right-[50%] bg-white rounded-lg shadow-xl border z-50'
                            style={{ minWidth: '300px' }}
                        >
                            {renderCalendar()}
                        </div>
                    )}

                    <div className='flex flex-col gap-3 rounded-[30px] bg-[#ffffff56] px-[10px] py-[10px]' style={{ border: '1px solid #fff' }}>
                        {/* Date Tabs */}
                        <div className='flex overflow-hidden items-center gap-2'>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${dateFilterType === 'today' ? 'bg-white rounded-[30px] text-blue-600' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                                onClick={() => handleDateFilterChange('today')}
                            >
                                Daily
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${dateFilterType === 'week' ? 'bg-white rounded-[30px] text-blue-600' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                                onClick={() => handleDateFilterChange('week')}
                            >
                                Weekly
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${dateFilterType === 'month' ? 'bg-white rounded-[30px] text-blue-600' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                                onClick={() => handleDateFilterChange('month')}
                            >
                                Monthly
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${dateFilterType === 'quarter' ? 'bg-white rounded-[30px] text-blue-600' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                                onClick={() => handleDateFilterChange('quarter')}
                            >
                                Quarterly
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${dateFilterType === 'year' ? 'bg-white rounded-[30px] text-blue-600' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                                onClick={() => handleDateFilterChange('year')}
                            >
                                Annually
                            </button>


                        </div>
                    </div>
                </div>
            </div>

            <div className='w-[99%] flex justify-center items-center bg-[#fff] rounded-[10px]'
                style={{ boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px', padding: '30px 0' }}>
                <div className='w-[96%] flex justify-between items-start gap-6 '>
                    {/* Profile and Stats Section */}
                    <div className='flex flex-col gap-4 w-full'>
                        <div className='flex flex-col gap-4 items-start w-[100%]'>
                            <div className='w-[100%] flex items-center justify-between'>
                                <div className='flex gap-4 items-center'>
                                    <div className='flex justify-center items-center h-[75px] w-[75px]'>
                                        {profileLoading ? (
                                            <div>Loading...</div>
                                        ) : profilePicture ? (
                                            <img
                                                src={profilePicture}
                                                className='w-[90%] h-[90%] rounded-[50%]'
                                                style={{ objectFit: 'cover' }}
                                                alt={`${currentUser?.displayName || 'User'}'s profile`}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = document.createElement('div');
                                                    fallback.className = 'avatar-fallback';
                                                    fallback.textContent = (currentUser?.displayName || 'U').charAt(0).toUpperCase();
                                                    e.currentTarget.parentElement!.replaceChildren(fallback);
                                                }}
                                            />
                                        ) : (
                                            <div className="avatar-fallback">
                                                {(currentUser?.displayName || currentUser?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <Text style={{ fontWeight: 'bold', fontSize: '18px' }}>
                                            {currentUser?.displayName || currentUser?.name || 'HR Dashboard'}
                                        </Text>
                                    </div>
                                </div>
                                <div>
                                    <Button
                                        appearance="subtle"
                                        icon={<Mail20Regular/>}
                                        onClick={()=>handleShareReport()}
                                        disabled={IsSendingEmail}
                                    >
                                        {IsSendingEmail ? 'Sending...' : 'Share Report'}
                                    </Button>
                                </div>
                            </div>

                            <div className='flex items-center gap-2 w-[95%]'>
                                <Briefcase20Regular />
                                <Text>
                                    {getActiveJobsCount()} Active Jobs
                                </Text>
                            </div>
                        </div>

                        {/* Dashboard Stats Section */}
                        <div className='w-[100%] flex flex-col items-start gap-4'>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full'>
                                <div
                                    onClick={() => handleCardClick('scheduled', scheduledInterview, `Scheduled Interviews (${getDateFilterDisplay()})`)}
                                    className='bg-gray-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center'
                                >
                                    <Text className='!flex !flex-col !gap-2'>
                                        <Calendar20Regular style={{ backgroundColor: '#DBEAFE', color: '#2563EB', padding: '5px', borderRadius: '4px', height: '30px', width: '30px' }} />
                                        <span style={{ color: '#242424', fontWeight: '600' }}>Scheduled Interviews</span>
                                        {/* <span style={{ color: 'ACACAC', fontWeight: '400', fontSize: '12px' }}>{getDateFilterDisplay()}</span> */}
                                        </Text>
                                    <Text size={600} weight="bold">{scheduledInterview.length}</Text>
                                </div>
                                <div
                                    onClick={() => handleCardClick('completed', completedInterview, `Completed Interviews (${getDateFilterDisplay()})`)}
                                    className='bg-gray-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center'
                                >
                                    <Text className='!flex !flex-col !gap-2'>
                                        <ApprovalsApp20Regular style={{ backgroundColor: '#D1FAE5', color: '#059669', padding: '5px', borderRadius: '4px', height: '30px', width: '30px' }} />
                                        <span style={{ color: '#242424', fontWeight: '600' }}>Completed Interviews</span>
                                        {/* <span style={{ color: 'ACACAC', fontWeight: '400', fontSize: '12px' }}>{getDateFilterDisplay()}</span> */}
                                        </Text>
                                    <Text size={600} weight="bold">{completedInterview.length}</Text>
                                </div>
                                <div
                                    onClick={() => handleCardClick('hired', hiredCandidate, `Hired Candidates (${getDateFilterDisplay()})`)}
                                    className='bg-gray-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center'
                                >
                                    <Text className='!flex !flex-col !gap-2'>
                                        <People20Regular style={{ backgroundColor: '#F3E8FF', color: '#9333E', padding: '5px', borderRadius: '4px', height: '30px', width: '30px' }} />
                                        <span style={{ color: '#242424', fontWeight: '600' }}>Hired Candidates</span>
                                        {/* <span style={{ color: 'ACACAC', fontWeight: '400', fontSize: '12px' }}>{getDateFilterDisplay()}</span> */}
                                        </Text>
                                    <Text size={600} weight="bold">{hiredCandidate.length}</Text>
                                </div>
                                <div
                                    onClick={() => handleCardClick('material', materialSharedCandidate, `Material Shared (${getDateFilterDisplay()})`)}
                                    className='bg-gray-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center'
                                >
                                    <Text className='!flex !flex-col !gap-2'>
                                        <ArrowUpload20Regular style={{ backgroundColor: '#E0E7FF', color: '#4F46E5', padding: '5px', borderRadius: '4px', height: '30px', width: '30px' }} />
                                        <span style={{ color: '#242424', fontWeight: '600' }}>Learning plan shared</span>
                                        {/* <span style={{ color: 'ACACAC', fontWeight: '400', fontSize: '12px' }}>{getDateFilterDisplay()}</span> */}
                                        </Text>
                                    <Text size={600} weight="bold">{materialSharedCandidate.length}</Text>
                                </div>
                                <div
                                    onClick={() => handleCardClick('pending', pendingAction, `Pending Actions (${getDateFilterDisplay()})`)}
                                    className='bg-gray-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center'
                                >
                                    <Text className='!flex !flex-col !gap-2'>
                                        <Info20Regular style={{ backgroundColor: '#FFEDD5', color: '#EA580C', padding: '5px', borderRadius: '4px', height: '30px', width: '30px' }} />
                                        <span style={{ color: '#242424', fontWeight: '600' }}>Pending Actions</span>
                                        {/* <span style={{ color: 'ACACAC', fontWeight: '400', fontSize: '12px' }}>{getDateFilterDisplay()}</span> */}
                                        </Text>
                                    <Text size={600} weight="bold">{pendingAction.length}</Text>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drawer for displaying details */}
            <Drawer
                open={isDrawerOpen}
                onOpenChange={(_, { open }) => setIsDrawerOpen(open)}
                position="end"
                size="large"
                style={{ maxWidth: '80%', width: '80vw' }}
            >
                <DrawerHeader>
                    <div className='flex items-center justify-between w-full'>
                        <Text size={500} weight="semibold">{drawerTitle}</Text>
                        <Button
                            appearance="subtle"
                            icon={<Dismiss24Regular />}
                            onClick={() => setIsDrawerOpen(false)}
                        />
                    </div>
                </DrawerHeader>
                <DrawerBody>
                    {renderDrawerContent()}
                </DrawerBody>
            </Drawer>
        </div>
    );
};

export default HRInfoDashboard;