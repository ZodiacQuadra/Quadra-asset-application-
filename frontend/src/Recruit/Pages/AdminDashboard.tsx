import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Text,
    Avatar,
    Drawer,
    DrawerHeader,
    DrawerBody,
    Button,
    Spinner,
    Body1Strong
} from "@fluentui/react-components";
import { AdminDashboardData, getAdminDashboardData, sendEmailToManagement } from '../../Services/JDRequests';
import { useAuth } from '../../Auth/AuthProvider';
import { fetchProfilePicture, getUserByID } from '../../Services/GraphAPI';
import {
    Briefcase20Regular,
    Person20Regular,
    Dismiss24Regular,
    Calendar20Regular,
    ApprovalsApp20Regular,
    People20Regular,
    ArrowUpload20Regular,
    Info20Regular,
    CalendarLtr20Regular,
    Clipboard3Day20Regular,
    ChevronRight20Regular,
    Mail20Regular
} from '@fluentui/react-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { set } from 'date-fns';

// Date filter types
type DateFilterType = 'today' | 'week' | 'month' | 'quarter' | 'year';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(false);
    const { currentUser, accessToken ,refreshToken}: any = useAuth();
    const calendarRef = useRef<HTMLDivElement>(null);
    const toggleButtonRef = useRef<HTMLButtonElement>(null);
    const hrTeamMembersLoadedRef = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Parse initial state from URL query params (e.g. navigated from HRInfoDashboard)
    const _urlParams = new URLSearchParams(location.search);
    const _urlDateType = _urlParams.get('dateType') as DateFilterType | null;
    const _urlSelectedDate = _urlParams.get('selectedDate');
    const _urlUserId = _urlParams.get('selectedUserId');

    const _initialDateType: DateFilterType =
        _urlDateType && ['today', 'week', 'month', 'quarter', 'year'].includes(_urlDateType)
            ? _urlDateType
            : 'today';
    const _initialDate = (() => {
        if (_urlSelectedDate) {
            const d = new Date(decodeURIComponent(_urlSelectedDate));
            if (!isNaN(d.getTime())) return d;
        }
        return new Date();
    })();
    const _initialUserId = _urlUserId || null;

    // Dashboard stats (filtered by date)
    const [scheduledInterview, setScheduledInterview] = useState<any[]>([]);
    const [completedInterview, setCompletedInterview] = useState<any[]>([]);
    const [hiredCandidate, setHiredCandidate] = useState<any[]>([]);
    const [materialSharedCandidate, setMaterialSharedCandidate] = useState<any[]>([]);
    const [pendingAction, setPendingAction] = useState<any[]>([]);
    const [hrApplicants, setHrApplicants] = useState<any[]>([]);

    // HR Team Members (static - no date filter)
    const [hrTeamMembers, setHrTeamMembers] = useState<any[]>([]);
    const [totalJdRequests, setTotalJdRequests] = useState<any[]>([]);
    const [userJobCounts, setUserJobCounts] = useState<Record<string, number>>({});
    const [userProfilePictures, setUserProfilePictures] = useState<Record<string, string>>({});

    // Profile states
    const [currentProfilePicture, setCurrentProfilePicture] = useState<string | undefined>();
    const [selectedUserProfilePicture, setSelectedUserProfilePicture] = useState<string | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

    // Selected user filter state (initialised from URL if present)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(_initialUserId);

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState<any[]>([]);
    const [drawerTitle, setDrawerTitle] = useState('');
    const [drawerType, setDrawerType] = useState('');

    // Date filter states (initialised from URL if present)
    const [dateFilterType, setDateFilterType] = useState<DateFilterType>(_initialDateType);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(_initialDate);
    const [IsSendingEmail,setIsSendingEmail] = useState(false)

    // Clear URL params once on mount after state has been seeded from them
    useEffect(() => {
        if (location.search) {
            navigate(location.pathname, { replace: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    // Helper function to safely check permissions
  const checkPermission = (permissionPath: string) => {
    const paths = permissionPath.split(".");
    let current: any = currentUser?.permissions;

    for (const path of paths) {
      if (!current || current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    return current === true;
  };

    // Fetch dashboard stats with date filtering

    const loadingRef = useRef(false)
    const fetchDashboardStats = useCallback(async () => {
        if (!accessToken || !currentUser) {
            // console.log('Missing accessToken or currentUser');
            return;
        }

        if(loadingRef.current){
            return
        }

        loadingRef.current = true

        setLoading(true);
        try {
            // console.log('Fetching dashboard stats with:', {
            //     selectedUserId,
            //     dateFilterType,
            //     selectedDate
            // });

            const response = await getAdminDashboardData(accessToken, {
                selectedUserId: selectedUserId || undefined,
                dateFilterType,
                selectedDate
            });

            if (response.success && response.data) {
                const data = response.data;
                // console.log('Dashboard stats received:', {
                //     scheduled: data.dashboardStats?.scheduledInterviews?.length,
                //     completed: data.dashboardStats?.completedInterviews?.length,
                //     hired: data.dashboardStats?.hiredCandidates?.length,
                //     material: data.dashboardStats?.materialSharedCandidates?.length,
                //     pending: data.dashboardStats?.pendingActionInterviews?.length
                // });

                // Update dashboard stats (filtered by date)
                setScheduledInterview(data.dashboardStats?.scheduledInterviews || []);
                setCompletedInterview(data.dashboardStats?.completedInterviews || []);
                setHiredCandidate(data.dashboardStats?.hiredCandidates || []);
                setMaterialSharedCandidate(data.dashboardStats?.materialSharedCandidates || []);
                setPendingAction(data.dashboardStats?.pendingActionInterviews || []);
                setHrApplicants(data.dashboardStats?.totalApplicants || []);

                // Load HR team members only once (static data, no re-fetch on filter changes)
                if (!hrTeamMembersLoadedRef.current) {
                    hrTeamMembersLoadedRef.current = true;

                    // If a user filter is active the current response only has that user's data.
                    // Fetch with null to always get the full HR team list.
                    // Use 'today' (not 'all') when fetching the HR team list to avoid
                    // a full-table scan — hrTeamMembers is date-independent.
                    const teamData = selectedUserId
                        ? await getAdminDashboardData(accessToken, {
                            selectedUserId: null,
                            dateFilterType: 'today',
                            selectedDate: new Date()
                          }).then(r => (r.success && r.data ? r.data : data))
                        : data;

                    const hrMembers = teamData.hrTeamMembers || [];
                    setHrTeamMembers(hrMembers);

                    const counts: Record<string, number> = { 'all': 0 };
                    if (teamData.allData?.jdRequests) {
                        teamData.allData.jdRequests.forEach((item: any) => {
                            const interviewerId = item.InterviewerID?.toString().toLowerCase().trim();
                            if (interviewerId) {
                                if (!counts[interviewerId]) counts[interviewerId] = 0;
                                counts[interviewerId]++;
                                counts['all']++;
                            }
                        });
                    }
                    setUserJobCounts(counts);
                    setTotalJdRequests(teamData.allData?.jdRequests || []);

                    // Load profile pictures in the background — do not await so the
                    // dashboard renders immediately with data and photos fill in after.
                    Promise.all(
                        hrMembers.map(async (user: any) => {
                            const userId = user.UserId;
                            if (userId && accessToken) {
                                try {
                                    const pictureUrl = await fetchProfilePicture(userId, accessToken);
                                    return { userId, pictureUrl };
                                } catch {
                                    return { userId, pictureUrl: null };
                                }
                            }
                            return null;
                        })
                    ).then(profileResults => {
                        const profileMap: Record<string, string> = {};
                        profileResults.forEach(result => {
                            if (result?.userId && result.pictureUrl) {
                                profileMap[result.userId.toLowerCase().trim()] = result.pictureUrl;
                            }
                        });
                        setUserProfilePictures(profileMap);
                    });
                }

                // console.log('Dashboard stats loaded successfully');
            } else {
                console.error('Failed to fetch dashboard stats:', response.error);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
            localStorage.removeItem("inductionPagination");
            loadingRef.current = false;
        }
    }, [accessToken, currentUser, selectedUserId, dateFilterType, selectedDate]);

    // console.log('Selected User ID:', selectedUserId,currentUser?.userID);

   useEffect(()=>{
    if(!checkPermission("recruit.recruit_dashboard.view_all")){
        navigate("/recruit")
    }
   },[accessToken,currentUser])

    // Fetch stats when date filters change
    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    // Fetch selected user profile when user changes
    useEffect(() => {
        const fetchSelectedUserProfile = async () => {
            if (!selectedUserId || !accessToken) {
                setSelectedUserProfile(null);
                setSelectedUserProfilePicture(null);
                return;
            }

            setProfileLoading(true);
            try {
                // Find user details from hrTeamMembers
                const userDetails = hrTeamMembers.find(user =>
                    user.UserId?.toLowerCase().trim() === selectedUserId.toLowerCase().trim()
                );

                if (userDetails) {
                    setSelectedUserProfile(userDetails);
                }

                // Fetch fresh profile picture for selected user
                const pictureUrl = await fetchProfilePicture(selectedUserId, accessToken);
                setSelectedUserProfilePicture(pictureUrl);

            } catch (error) {
                console.error('Failed to load selected user profile:', error);
                setSelectedUserProfilePicture(null);
            } finally {
                setProfileLoading(false);
            }
        };

        fetchSelectedUserProfile();
    }, [selectedUserId, accessToken, hrTeamMembers]);

    // Click-away listener for calendar: closes on outside click or Escape key
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!showCalendar) return;
            const target = e.target as Node;

            const clickedInsideCalendar = calendarRef.current && calendarRef.current.contains(target);
            const clickedOnToggle = toggleButtonRef.current && toggleButtonRef.current.contains(target);

            if (!clickedInsideCalendar && !clickedOnToggle) {
                setShowCalendar(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showCalendar) {
                setShowCalendar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showCalendar]);

    // Date range functions (keep as is)
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
                return { startDate: null, endDate: null };
        }
    };

    const handleUserSelect = (userId: string | null) => {
        setSelectedUserId(userId);
    };

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

    // Helper function to get display name
    const getDisplayName = () => {
        if (selectedUserId === null) {
            return "Overall Insights";
        }
        if (selectedUserId && selectedUserProfile) {
            return selectedUserProfile.displayName || selectedUserProfile.name || 'Selected User';
        }
        return currentUser?.displayName || currentUser?.name || 'Admin Dashboard';
    };

    // Helper function to route to full dashboard
    const routeToFullDashboard = () => {
        if (selectedUserId === null) {
            navigate('/recruit');
        }
        else {
            navigate(`/recruit?hrUserId=${selectedUserId}`);
        }
    }

    // Helper function to get profile picture
    const getProfilePicture = () => {
        if (selectedUserId === null) return null;
        return selectedUserProfilePicture || null;
    };

    // Helper function to get fallback initial
    const getFallbackInitial = (): string | null => {
        if (selectedUserId === null) {
            return null;
        }

        let name = '';
        if (selectedUserId && selectedUserProfile) {
            name = selectedUserProfile.displayName || selectedUserProfile.name || '';
        } else if (!selectedUserId && currentUser) {
            name = currentUser.displayName || currentUser.name || '';
        }

        return name ? name.charAt(0).toUpperCase() : '?';
    };

    // Helper function to get active jobs count
    const getActiveJobsCount = () => {
        if (selectedUserId) {
            const user = hrTeamMembers.find(user =>
                user.UserId?.toLowerCase().trim() === selectedUserId.toLowerCase().trim()
            );
            return user?.ActiveJobCount || 0;
        }
        return totalJdRequests.length;
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

    // Handle date filter change
    const handleDateFilterChange = (value: DateFilterType) => {
        setDateFilterType(value);
        // Create UTC date at midnight
        const now = new Date();
        setSelectedDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)));
    };

    // Handle calendar date selection - ALWAYS use UTC midnight
    const handleCalendarDateSelect = (date: Date) => {
        // Create a UTC date at midnight to avoid timezone issues
        const utcDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0, 0, 0, 0
        ));
        setSelectedDate(utcDate);
        setShowCalendar(false);
    };


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

            
            try{
                await checkSessionExpired()
                setIsSendingEmail(true);
                const response = await sendEmailToManagement({
                    selectedUserId: userId,
                    dateFilterType: dateFilterType,
                    selectedDate: selectedDate,
                    accessToken:accessToken
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
                            onClick={() => setSelectedDate(new Date(Date.UTC(currentYear - 1, 0, 1, 0, 0, 0)))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ‹
                        </button>
                        <Text weight="semibold">
                            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <button
                            onClick={() => setSelectedDate(new Date(Date.UTC(currentYear + 1, 0, 1, 0, 0, 0)))}
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
                            onClick={() => setSelectedDate(new Date(Date.UTC(currentYear - 1, 0, 1, 0, 0, 0)))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ‹
                        </button>
                        <Text weight="semibold">
                            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <button
                            onClick={() => setSelectedDate(new Date(Date.UTC(currentYear + 1, 0, 1, 0, 0, 0)))}
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
                            onClick={() => setSelectedDate(new Date(Date.UTC(currentYear - 1, 0, 1, 0, 0, 0)))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ‹
                        </button>
                        <Text weight="semibold">
                            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <button
                            onClick={() => setSelectedDate(new Date(Date.UTC(currentYear + 1, 0, 1, 0, 0, 0)))}
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
                            onClick={() => setSelectedDate(new Date(Date.UTC(currentYear - 1, 0, 1, 0, 0, 0)))}
                            className="px-2 py-1 hover:bg-gray-100 rounded"
                        >
                            ‹
                        </button>
                        <Text weight="semibold">
                            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <button
                            onClick={() => setSelectedDate(new Date(Date.UTC(currentYear + 1, 0, 1, 0, 0, 0)))}
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
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Email</th>  --remove */}
                                    <th className='p-3 text-left text-sm font-semibold'>Job Role</th>
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Interview Title</th>  -remove */}
                                    <th className='p-3 text-left text-sm font-semibold'>Scheduled Date</th>
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Created Date</th>-remove */}
                                    {/* <th className='p-3 text-left text-sm font-semibold'>Interviewers</th> */}
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
                                        {/* <td className='p-3 text-sm'>
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
                                        </td> */}
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
                    <table className='w-full border-collapse'>
                        <thead>
                            <tr className='bg-gray-100 border-b'>
                                <th className='p-3 text-left text-sm font-semibold'>Applicant Name</th>
                                {/* <th className='p-3 text-left text-sm font-semibold'>Email</th> */}
                                {/* <th className='p-3 text-left text-sm font-semibold'>Phone</th> */}
                                {/* <th className='p-3 text-left text-sm font-semibold'>Job Code</th> */}
                                {/* <th className='p-3 text-left text-sm font-semibold'>Created Date</th> */}
                                <th className='p-3 text-left text-sm font-semibold'>Level</th>
                                <th className='p-3 text-left text-sm font-semibold'>Job Role</th>
                                <th className='p-3 text-left text-sm font-semibold'>Department</th>
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
                                    {/* <td className='p-3 text-sm'>{item.Email || 'N/A'}</td> */}
                                    {/* <td className='p-3 text-sm'>{item.Phone || 'N/A'}</td> */}
                                    {/* <td className='p-3 text-sm'>{handleJobCode(item.JobPostingID) || 'N/A'}</td> */}
                                    {/* <td className='p-3 text-sm'>{formatDateTime(item.CreatedAt)}</td> */}
                                    <td className='p-3 text-sm'>{item.Experienced ? 'Experienced' : 'Fresher'}</td>
                                    <td className='p-3 text-sm'>{item.JobRole || '-'}</td>
                                    <td className='p-3 text-sm'>{item. Department || '-'}</td>
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
                );

            default:
                return <Text>No content available</Text>;
        }
    };

    if(!checkPermission("recruit.recruit_dashboard.view_all")){
        return(
            <div className='flex w-full justify-center items-center'>
                Permission Denied
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 h-full">
                <Spinner />
                <Body1Strong className="mt-2">    Loading Recruitment Dashboard...</Body1Strong>
            </div>
        );
    }



    return (
        <div className='flex flex-col items-start justify-start gap-5 h-[100%] w-[100%]'>
            <div className='w-[100%] flex justify-center items-center' >
                <div className='flex w-[97%] justify-between items-center'>
                    <div className='flex flex-col gap-2'>
                        <p style={{ fontSize: 'large', fontWeight: '600' }}>Team Performance Overview</p>
                        <p style={{ fontSize: 'small', fontWeight: '400', color: '#2e2e2e' }}>Select HR member to view recruitment summary</p>
                    </div>

                    {/* Date Filters as Tabs */}
                    <div className='flex gap-2 items-center relative'>
                        <button
                            ref={toggleButtonRef}
                            onClick={() => setShowCalendar(!showCalendar)}
                            style={{ border: '1px solid #ffffff', fontSize: 'large' }}
                            className={`cursor-pointer px-4 py-4 rounded-[30px] ${showCalendar ? 'bg-[#0C59A4] text-white' : 'bg-[#ffffff56] text-gray-700'} hover:shadow-md transition-all flex items-center gap-2`}
                        >
                            <CalendarLtr20Regular />
                            <span className="text-sm font-medium">{getDateFilterDisplay()}</span>
                        </button>
                        {showCalendar && (
                            <div
                                ref={calendarRef}
                                className='absolute top-[98%] right-[50%] bg-white rounded-lg shadow-xl border z-50'
                                style={{ minWidth: '300px' }}
                            >
                                {renderCalendar()}
                            </div>
                        )}
                        <div className='flex flex-col gap-3 rounded-[30px] bg-[#ffffff56] px-[10px] py-[10px]' style={{ border: '1px solid #fff' }}>
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
                                    Annual
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='w-[99%] flex justify-center items-center rounded-[10px]' >
                <div className='w-[96%] flex justify-between items-start gap-6 '>

                    {/* HR Team Members Section - STATIC, NO DATE FILTER */}
                    <div className='w-[30%] flex flex-col items-start gap-4'>
                        <div className='flex items-center gap-2'>
                            <Person20Regular />
                            <Text size={400} weight="semibold">
                                HR Team Members
                            </Text>
                        </div>

                        {hrTeamMembers.length > 0 ? (
                            <div className='flex flex-col gap-4 w-full'>
                                {/* All Users Card */}
                                <div
                                    onClick={() => handleUserSelect(null)}
                                    className={`flex items-center gap-3 px-3 py-4 rounded-lg cursor-pointer transition-all ${selectedUserId === null
                                        ? 'bg-white border-2 border-blue-500 shadow-md'
                                        : 'bg-white border border-gray-200 hover:shadow-md'
                                        }`}
                                >
                                    <div className='flex justify-between items-center w-[100%]'>
                                        <span className='flex items-center gap-2'>
                                            <span className='h-[45px] w-[45px] flex justify-center items-center bg-[#F37A2F] rounded-[50%]'>
                                                <Clipboard3Day20Regular className='h-[22px] w-[22px]' style={{ color: '#fff' }} />
                                            </span>
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>Recruitment Overview</span>
                                        </span>
                                        <div className='flex items-center gap-2'>
                                            <p className='flex flex-col items-end gap-1'>
                                                <span style={{ fontSize: 'large', fontWeight: '600' }}>{totalJdRequests.length}</span>
                                                <span style={{ fontSize: 'small', fontWeight: '400' }}>active</span>
                                            </p>
                                            <ChevronRight20Regular />
                                        </div>
                                    </div>
                                </div>

                                {/* Individual User Cards */}
                                {hrTeamMembers.map((user: any, index: number) => {
                                    const userId = user.UserId?.toLowerCase().trim();
                                    const jobCount = user.ActiveJobCount || 0;
                                    const displayName = user.displayName || user.UserId || 'User';
                                    const initial = displayName.charAt(0).toUpperCase();
                                    const profilePicture = userId ? userProfilePictures[userId] : null;

                                    return (
                                        <div
                                            key={user.UserId || index}
                                            onClick={() => handleUserSelect(user.UserId)}
                                            className={`flex items-center gap-3 px-3 py-4 rounded-lg cursor-pointer transition-all ${selectedUserId?.toUpperCase() === user.UserId?.toUpperCase()
                                                ? 'bg-white border-2 border-blue-500 shadow-md'
                                                : 'bg-white border border-gray-200 hover:shadow-md'
                                                }`}
                                        >
                                            {profilePicture ? (
                                                <img
                                                    src={profilePicture}
                                                    alt={`${displayName}'s profile`}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const container = e.currentTarget.parentElement;
                                                        if (container) {
                                                            const fallback = document.createElement('div');
                                                            fallback.className = 'flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 border-2 border-gray-100 text-gray-600 font-semibold text-lg';
                                                            fallback.textContent = initial;
                                                            container.appendChild(fallback);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 border-2 border-gray-100 text-gray-600 font-semibold text-lg">
                                                    {initial}
                                                </div>
                                            )}

                                            <div className='flex justify-between items-center w-full'>
                                                <div className='flex flex-col'>
                                                    <Text size={300} weight="semibold">
                                                        {displayName}
                                                    </Text>
                                                    <Text size={200} className='text-gray-500'>
                                                        {user.department || 'N/A'}
                                                    </Text>
                                                </div>

                                                <div className='flex items-center gap-2'>
                                                    <div className='flex flex-col items-end gap-1'>
                                                        <span style={{ fontSize: 'large', fontWeight: '600' }}>
                                                            {jobCount}
                                                        </span>
                                                        <span style={{ fontSize: 'small', fontWeight: '400' }}>active</span>
                                                    </div>
                                                    <ChevronRight20Regular />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className='w-full p-4 text-center border border-dashed border-gray-300 rounded-lg'>
                                <Text size={300} className='text-gray-500'>
                                    No HR team members found
                                </Text>
                            </div>
                        )}
                    </div>

                    {/* Profile and Stats Section - WITH DATE FILTER */}
                    <div className='flex justify-center items-center w-[65%] bg-[#fff] rounded-[10px]' style={{ boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px' }}>
                        <div className='w-[95%] py-[18px] flex flex-col gap-3'>
                            {/* Profile Header */}
                            <div className='w-[100%] flex flex-col items-start gap-3 justify-between'>
                                <div className='w-full flex justify-between'>
                                    <div className='flex gap-4 items-center'>
                                        {selectedUserId !== null ? (
                                            <div className='flex justify-center items-center h-[75px] w-[75px] relative'>
                                                {profileLoading ? (
                                                    <div className="flex items-center justify-center w-full h-full">
                                                        <Spinner size="small" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        {getProfilePicture() ? (
                                                            <img
                                                                src={getProfilePicture() || ''}
                                                                className='w-[90%] h-[90%] rounded-[50%] object-cover'
                                                                alt={`${getDisplayName()}'s profile`}
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    const fallbackEl = document.createElement('div');
                                                                    fallbackEl.className = 'avatar-fallback flex items-center justify-center w-full h-full rounded-full bg-gray-200';
                                                                    fallbackEl.textContent = getFallbackInitial() || '?';
                                                                    e.currentTarget.parentElement?.appendChild(fallbackEl);
                                                                }}
                                                            />
                                                        ) : getFallbackInitial() ? (
                                                            <div className="avatar-fallback flex items-center justify-center w-full h-full rounded-full bg-gray-200 text-gray-600 font-semibold text-xl">
                                                                {getFallbackInitial()}
                                                            </div>
                                                        ) : (
                                                            <div className="avatar-fallback flex items-center justify-center w-full h-full rounded-full bg-gray-200">
                                                                <Person20Regular />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className='flex justify-center items-center h-[45px] w-[45px] bg-[#F37A2F] rounded-[50%]'>
                                                <Clipboard3Day20Regular className='h-[22px] w-[22px]' style={{ color: '#fff' }} />
                                            </div>
                                        )}

                                        <div className='flex gap-2 items-center'>
                                            <Text style={{ fontWeight: 'bold', fontSize: '18px' }}>
                                                {getDisplayName()}
                                            </Text>
                                        </div>
                                    </div>

                                    <Button appearance='transparent' className='!font-medium !text-xs' onClick={() => routeToFullDashboard()}>{"View Full Dashboard"} {<ChevronRight20Regular />}</Button>
                                </div>
                                <div className='flex gap-2 w-full justify-between'>
                                <p className='flex gap-2 items-center'>
                                    <Briefcase20Regular />
                                    <span style={{ fontWeight: '600' }}>
                                        {getActiveJobsCount()}
                                    </span> Active Jobs
                                </p>
                                {
                                    currentUser.userID?.toUpperCase() === selectedUserId?.toUpperCase() && (
                                        <Button disabled={IsSendingEmail} appearance='subtle' color='text-blue-600' icon={<Mail20Regular/>} onClick={handleShareReport}>{IsSendingEmail?"Sending Email...":"Share Report"}</Button>

                                    )
                                }
                                </div>
                            </div>

                            {/* Dashboard Stats Section - WITH DATE FILTER */}
                            <div className='w-[100%] flex flex-col items-start gap-4'>
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full'>
                                    <div
                                        onClick={() => handleCardClick('scheduled', scheduledInterview, `Scheduled Interviews (${getDateFilterDisplay()})`)}
                                        className='bg-gray-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center'
                                    >
                                        <Text className='!flex !flex-col !gap-2'>
                                            <Calendar20Regular style={{ backgroundColor: '#DBEAFE', color: '#2563EB', padding: '5px', borderRadius: '4px', height: '30px', width: '30px' }} />
                                            <span style={{ color: '#242424', fontWeight: '600' }}>Scheduled Interviews</span>
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
                                        </Text>
                                        <Text size={600} weight="bold">{completedInterview.length}</Text>
                                    </div>
                                    <div
                                        onClick={() => handleCardClick('hired', hiredCandidate, `Hired Candidates (${getDateFilterDisplay()})`)}
                                        className='bg-gray-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center'
                                    >
                                        <Text className='!flex !flex-col !gap-2'>
                                            <People20Regular style={{ backgroundColor: '#F3E8FF', color: '#9333EA', padding: '5px', borderRadius: '4px', height: '30px', width: '30px' }} />
                                            <span style={{ color: '#242424', fontWeight: '600' }}>Hired Candidates</span>
                                        </Text>
                                        <Text size={600} weight="bold">{hiredCandidate.length}</Text>
                                    </div>
                                    <div
                                        onClick={() => handleCardClick('pending', pendingAction, `Pending Actions (${getDateFilterDisplay()})`)}
                                        className='bg-gray-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center'
                                    >
                                        <Text className='!flex !flex-col !gap-2'>
                                            <Info20Regular style={{ backgroundColor: '#FFEDD5', color: '#EA580C', padding: '5px', borderRadius: '4px', height: '30px', width: '30px' }} />
                                            <span style={{ color: '#242424', fontWeight: '600' }}>Pending Actions</span>
                                        </Text>
                                        <Text size={600} weight="bold">{pendingAction.length}</Text>
                                    </div>
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

export default AdminDashboard;