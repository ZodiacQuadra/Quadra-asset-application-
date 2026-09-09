import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Input,
  Button,
  Avatar,
  Text,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Field,
  Spinner,
  makeStyles,
  tokens,
  Tooltip,
  mergeClasses,
  shorthands,
} from "@fluentui/react-components";
import {
  PersonRegular,
  DismissRegular,
  SearchRegular,
  ChevronDownRegular,
  CheckmarkCircleFilled,
  PersonAddRegular,
  PeopleRegular,
  InfoRegular,
} from "@fluentui/react-icons";
import { fetchUsers } from "../../../Services/GraphAPI";
import { useAuth } from "../../../Auth/AuthProvider";

// Type definitions
interface Person {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  title?: string;
  department?: string;
  presence?: "available" | "busy" | "away" | "offline";
}

interface PeoplePickerProps {
  placeholder?: string;
  selectedPeople?: Person[];
  selectedPerson?: Person | null;
  onSelectionChanged?: (people: Person[] | Person | null) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  description?: string;
  errorMessage?: string;
  minSearchLength?: number;
  searchDelay?: number;
  multiple?: boolean;
  maxSelection?: number;
  showSelectedCount?: boolean;
  compact?: boolean;
  showPresence?: boolean;
  allowExternalUsers?: boolean;
  showRecentlySelected?: boolean;
  recentlySelectedLimit?: number;
}

interface SearchResult {
  results: Person[];
  isLoading: boolean;
  error?: string;
}

// Enhanced Styles
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    width: "100%",
  },
  inputContainer: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  selectedPeopleContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalXS,
    animation: "fadeIn 0.2s ease-in",
  },
  selectedPeopleList: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingVerticalXS,
    maxHeight: "120px",
    overflowY: "auto",
    padding: tokens.spacingVerticalS,
    border: `none`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: "transparent",
    transition: "all 0.2s ease",
    // "&:hover": {
    //   borderColor: tokens.colorNeutralStroke1Hover,
    // },
    // Custom scrollbar
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: tokens.colorNeutralBackground1,
      borderRadius: tokens.borderRadiusSmall,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStroke2,
      borderRadius: tokens.borderRadiusSmall,
      "&:hover": {
        backgroundColor: tokens.colorNeutralStroke1,
      },
    },
  },
  selectedPeopleListCompact: {
    maxHeight: "60px",
  },
  selectedPersonChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    padding: `8px 15px`,
    backgroundColor: "#E5EDF4",
    borderRadius: tokens.borderRadiusCircular,
    border: `1px solid ${tokens.colorBrandStroke1}`,
    maxWidth: "220px",
    transition: "all 0.2s ease",
    animation: "slideIn 0.2s ease-out",
    "&:hover": {
      backgroundColor: "#e2edf7ff",
      transform: "translateY(-1px)",
      boxShadow: tokens.shadow4,
    },
  },
  selectedPersonInfo: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    flex: 1,
  },
  selectedPersonName: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: "#0153A5",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "16px",
  },
  selectedPersonEmail: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "14px",
  },
  removeButton: {
    minWidth: "20px",
    minHeight: "20px",
    padding: "2px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: tokens.borderRadiusCircular,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#E5EDF4",
      color: tokens.colorPaletteRedForeground2,
      transform: "scale(1.1)",
    },
    "&:active": {
      transform: "scale(0.95)",
    },
  },
  inputWithIcon: {
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    transition: "all 0.2s ease",
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    "&::after": {
      // Remove extra focus/inner border if present
      border: "0 !important",
    },
    "&:focus-within": {
      boxShadow: `0 0 0 2px ${tokens.colorBrandStroke1}`,
    },
  },
  searchResults: {
    maxHeight: "320px",
    overflowY: "auto",
    ...shorthands.padding(tokens.spacingVerticalS),
    // Custom scrollbar
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: tokens.colorNeutralBackground1,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStroke2,
      borderRadius: tokens.borderRadiusSmall,
      "&:hover": {
        backgroundColor: tokens.colorNeutralStroke1,
      },
    },
  },
  personItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    cursor: "pointer",
    borderRadius: tokens.borderRadiusMedium,
    transition: "all 0.2s ease",
    position: "relative",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      transform: "translateX(4px)",
    },
    "&:active": {
      transform: "translateX(2px)",
    },
  },
  personItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  personInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    minWidth: 0,
  },
  personName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  personEmail: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  personTitle: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  emptyState: {
    ...shorthands.padding(tokens.spacingVerticalXL),
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
    "& svg": {
      fontSize: "48px",
      color: tokens.colorNeutralForeground4,
    },
  },
  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalL),
    gap: tokens.spacingHorizontalM,
  },
  errorState: {
    ...shorthands.padding(tokens.spacingVerticalL),
    textAlign: "center",
    color: tokens.colorPaletteRedForeground1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
  },
  selectionCount: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS,
  },
  expandButton: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2,
      textDecoration: "underline",
    },
  },
  selectedPersonCard: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalS,
    transition: "all 0.2s ease",
    animation: "slideDown 0.3s ease-out",
    // "&:hover": {
    //   borderColor: tokens.colorNeutralStroke1Hover,
    //   boxShadow: tokens.shadow2,
    // },
  },
  presenceIndicator: {
    position: "absolute",
    bottom: "-2px",
    right: "-2px",
    width: "10px",
    height: "10px",
    borderRadius: tokens.borderRadiusCircular,
    border: `2px solid ${tokens.colorNeutralBackground1}`,
  },
  presenceAvailable: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  presenceBusy: {
    backgroundColor: tokens.colorPaletteRedBackground3,
  },
  presenceAway: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
  },
  presenceOffline: {
    backgroundColor: tokens.colorNeutralStroke1,
  },
  sectionHeader: {
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  divider: {
    height: "1px",
    backgroundColor: tokens.colorNeutralStroke2,
    ...shorthands.margin(tokens.spacingVerticalXS, 0),
  },
  "@keyframes fadeIn": {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  "@keyframes slideIn": {
    from: {
      opacity: 0,
      transform: "translateX(-10px)",
    },
    to: {
      opacity: 1,
      transform: "translateX(0)",
    },
  },
  "@keyframes slideDown": {
    from: {
      opacity: 0,
      transform: "translateY(-10px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
});

// Enhanced Avatar with Presence
const AvatarWithPresence: React.FC<{
  person: Person;
  size?: 16 | 20 | 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 72 | 96 | 120 | 128;
  showPresence?: boolean;
}> = ({ person, size = 32, showPresence = false }) => {
  const styles = useStyles();

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Avatar
        name={person.displayName}
        image={person.avatar ? { src: person.avatar } : undefined}
        size={size}
        color="brand"
      />
      {showPresence && person.presence && (
        <div
          className={mergeClasses(
            styles.presenceIndicator,
            person.presence === "available" && styles.presenceAvailable,
            person.presence === "busy" && styles.presenceBusy,
            person.presence === "away" && styles.presenceAway,
            person.presence === "offline" && styles.presenceOffline
          )}
        />
      )}
    </div>
  );
};

// Enhanced Selected Person Chip Component
const SelectedPersonChip: React.FC<{
  person: Person;
  onRemove: () => void;
  disabled?: boolean;
  showPresence?: boolean;
}> = ({ person, onRemove, disabled, showPresence }) => {
  const styles = useStyles();

  return (
    <Tooltip
      content={
        <div>
          <div>{person.displayName}</div>
          <div style={{ fontSize: tokens.fontSizeBase100 }}>{person.email}</div>
          {person.title && (
            <div style={{ fontSize: tokens.fontSizeBase100 }}>
              {person.title}
            </div>
          )}
        </div>
      }
      relationship="label"
    >
      <div className={styles.selectedPersonChip}>
        <AvatarWithPresence
          person={person}
          size={20}
          showPresence={showPresence}
        />
        <div className={styles.selectedPersonInfo}>
          <div className={styles.selectedPersonName}>{person.displayName}</div>
        </div>
        {!disabled && (
          <button
            className={styles.removeButton}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title={`Remove ${person.displayName}`}
            aria-label={`Remove ${person.displayName}`}
          >
            <DismissRegular fontSize={14} color="#0153A5" />
          </button>
        )}
      </div>
    </Tooltip>
  );
};

// Enhanced Selected People List Component
const SelectedPeopleList: React.FC<{
  selectedPeople: Person[];
  onRemovePerson: (person: Person) => void;
  disabled?: boolean;
  compact?: boolean;
  maxVisible?: number;
  showPresence?: boolean;
}> = ({
  selectedPeople,
  onRemovePerson,
  disabled,
  compact,
  maxVisible = 5,
  showPresence,
}) => {
  const styles = useStyles();
  const [showAll, setShowAll] = useState(false);

  if (selectedPeople.length === 0) return null;

  const visiblePeople = showAll
    ? selectedPeople
    : selectedPeople.slice(0, maxVisible);
  const hiddenCount = selectedPeople.length - maxVisible;

  return (
    <div className={styles.selectedPeopleContainer}>
      <div
        className={mergeClasses(
          styles.selectedPeopleList,
          compact && styles.selectedPeopleListCompact
        )}
      >
        {visiblePeople.map((person) => (
          <SelectedPersonChip
            key={person.id}
            person={person}
            onRemove={() => onRemovePerson(person)}
            disabled={disabled}
            showPresence={showPresence}
          />
        ))}
        {!showAll && hiddenCount > 0 && (
          <button
            className={styles.expandButton}
            onClick={() => setShowAll(true)}
          >
            +{hiddenCount} more
          </button>
        )}
        {showAll && selectedPeople.length > maxVisible && (
          <button
            className={styles.expandButton}
            onClick={() => setShowAll(false)}
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

// Enhanced Person Search Item Component
const PersonSearchItem: React.FC<{
  person: Person;
  isSelected: boolean;
  onSelect: () => void;
  showPresence?: boolean;
}> = ({ person, isSelected, onSelect, showPresence }) => {
  const styles = useStyles();

  return (
    <div
      className={mergeClasses(
        styles.personItem,
        isSelected && styles.personItemSelected
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`${isSelected ? "Deselect" : "Select"} ${person.displayName}`}
    >
      <AvatarWithPresence
        person={person}
        size={36}
        showPresence={showPresence}
      />
      <div className={styles.personInfo}>
        <div className={styles.personName} title={person.displayName}>
          {person.displayName}
        </div>
        <div className={styles.personEmail} title={person.email}>
          {person.email}
        </div>
        {person.title && (
          <div className={styles.personTitle} title={person.title}>
            {person.title}
            {person.department && ` • ${person.department}`}
          </div>
        )}
      </div>
      {isSelected && (
        <CheckmarkCircleFilled
          fontSize={20}
          color={tokens.colorBrandForeground1}
        />
      )}
    </div>
  );
};

// Enhanced Search Results Component
const SearchResults: React.FC<{
  searchResult: SearchResult;
  searchQuery: string;
  selectedPeople: Person[];
  onPersonSelect: (person: Person) => void;
  minSearchLength: number;
  showPresence?: boolean;
  recentlySelected?: Person[];
  showRecentlySelected?: boolean;
}> = ({
  searchResult,
  searchQuery,
  selectedPeople,
  onPersonSelect,
  minSearchLength,
  showPresence,
  recentlySelected = [],
  showRecentlySelected = false,
}) => {
  const styles = useStyles();

  if (searchResult.isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="tiny" />
        <Text size={300}>Searching for people...</Text>
      </div>
    );
  }

  if (searchResult.error) {
    return (
      <div className={styles.errorState}>
        <InfoRegular fontSize={24} />
        <Text size={300}>{searchResult.error}</Text>
      </div>
    );
  }

  // Show recently selected when no search query
  if (
    showRecentlySelected &&
    searchQuery.length < minSearchLength &&
    recentlySelected.length > 0
  ) {
    return (
      <>
        <div className={styles.sectionHeader}>Recently Selected</div>
        <div className={styles.divider} />
        {recentlySelected.map((person) => {
          const isSelected = selectedPeople.some((p) => p.id === person.id);
          return (
            <PersonSearchItem
              key={person.id}
              person={person}
              isSelected={isSelected}
              onSelect={() => onPersonSelect(person)}
              showPresence={showPresence}
            />
          );
        })}
      </>
    );
  }

  if (searchResult.results.length > 0) {
    return (
      <>
        {searchResult.results.map((person) => {
          const isSelected = selectedPeople.some((p) => p.id === person.id);
          return (
            <PersonSearchItem
              key={person.id}
              person={person}
              isSelected={isSelected}
              onSelect={() => onPersonSelect(person)}
              showPresence={showPresence}
            />
          );
        })}
      </>
    );
  }

  if (searchQuery.length >= minSearchLength) {
    return (
      <div className={styles.emptyState}>
        <PersonRegular />
        <Text size={300} weight="semibold">
          No people found
        </Text>
        <Text size={200}>No results for "{searchQuery}"</Text>
      </div>
    );
  }

  return (
    <div className={styles.emptyState}>
      <SearchRegular />
      <Text size={200}>
        Type at least {minSearchLength} characters to search
      </Text>
    </div>
  );
};

// Enhanced Multi-Select People Picker Component
const MultiSelectPeoplePicker: React.FC<PeoplePickerProps> = ({
  placeholder = "Search for people...",
  selectedPeople = [],
  onSelectionChanged = () => {},
  disabled = false,
  required = false,
  label = "People",
  description = "",
  errorMessage = "",
  minSearchLength = 2,
  searchDelay = 300,
  multiple = true,
  maxSelection,
  compact = false,
  showPresence = false,
  showRecentlySelected = false,
  recentlySelectedLimit = 5,
}) => {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPeopleState, setSelectedPeopleState] = useState<Person[]>(
    selectedPeople
  );
  const { accessToken }: any = useAuth();
  const [searchResult, setSearchResult] = useState<SearchResult>({
    results: [],
    isLoading: false,
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recentlySelected, setRecentlySelected] = useState<Person[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recently selected from localStorage
  useEffect(() => {
    if (showRecentlySelected) {
      const stored = localStorage.getItem("recentlySelectedPeople");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRecentlySelected(parsed.slice(0, recentlySelectedLimit));
        } catch (e) {
          console.error("Failed to parse recently selected people", e);
        }
      }
    }
  }, [showRecentlySelected, recentlySelectedLimit]);

  // Save to recently selected
  const saveToRecentlySelected = useCallback(
    (person: Person) => {
      if (!showRecentlySelected) return;

      const updated = [
        person,
        ...recentlySelected.filter((p) => p.id !== person.id),
      ].slice(0, recentlySelectedLimit);

      setRecentlySelected(updated);
      localStorage.setItem("recentlySelectedPeople", JSON.stringify(updated));
    },
    [recentlySelected, showRecentlySelected, recentlySelectedLimit]
  );

  // Sync internal state with prop changes
  useEffect(() => {
    setSelectedPeopleState(selectedPeople);
  }, [selectedPeople]);

  // Search function with error handling
  const searchPeople = useCallback(
    async (query: string): Promise<void> => {
      if (query.length < minSearchLength) {
        setSearchResult({ results: [], isLoading: false });
        return;
      }

      setSearchResult((prev) => ({
        ...prev,
        isLoading: true,
        error: undefined,
      }));

      try {
        const results = await fetchUsers(query, accessToken);
        setSearchResult({
          results,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        setSearchResult({
          results: [],
          isLoading: false,
          error: "Failed to search people. Please try again.",
        });
      }
    },
    [minSearchLength]
  );

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPeople(searchQuery);
      }, searchDelay);
    } else {
      setSearchResult({ results: [], isLoading: false });
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchDelay, searchPeople]);

  // Handle person selection/deselection
  const handlePersonSelect = (person: Person): void => {
    if (!multiple) {
      const newSelection = selectedPeopleState.some((p) => p.id === person.id)
        ? []
        : [person];
      setSelectedPeopleState(newSelection);
      onSelectionChanged(newSelection);
      setSearchQuery("");
      setIsOpen(false);
      if (newSelection.length > 0) {
        saveToRecentlySelected(person);
      }
      return;
    }

    const isAlreadySelected = selectedPeopleState.some(
      (p) => p.id === person.id
    );
    let newSelection: Person[];

    if (isAlreadySelected) {
      newSelection = selectedPeopleState.filter((p) => p.id !== person.id);
    } else {
      if (maxSelection && selectedPeopleState.length >= maxSelection) {
        return;
      }
      newSelection = [...selectedPeopleState, person];
      saveToRecentlySelected(person);
    }

    setSelectedPeopleState(newSelection);
    onSelectionChanged(newSelection);
  };

  // Handle person removal
  const handlePersonRemove = (person: Person): void => {
    const newSelection = selectedPeopleState.filter((p) => p.id !== person.id);
    setSelectedPeopleState(newSelection);
    onSelectionChanged(newSelection);
  };

  // Handle input change
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearchQuery(event.target.value);
    setIsOpen(true);
  };

  // Handle input focus
  const handleInputFocus = (): void => {
    setIsOpen(true);
  };

  const shouldShowPopover =
    isOpen &&
    (searchQuery.length > 0 ||
      searchResult.results.length > 0 ||
      (showRecentlySelected && recentlySelected.length > 0));

  const isMaxSelectionReached =
    maxSelection && selectedPeopleState.length >= maxSelection;

  return (
    <div className={styles.container}>
      <Field
        label={
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {label}
          </div>
        }
        required={required}
        validationMessage={errorMessage}
        hint={description}
      >
        <div className={styles.inputContainer}>
          {/* Selection Count */}
          {/* {showSelectedCount && selectedPeopleState.length > 0 && (
            <div className={styles.selectionCount}>
              <Badge
                appearance="filled"
                color={isMaxSelectionReached ? "warning" : "brand"}
                size="small"
              >
                {selectedPeopleState.length} selected
                {maxSelection && ` of ${maxSelection}`}
              </Badge>
              {isMaxSelectionReached && (
                <Text
                  size={100}
                  style={{ color: tokens.colorPaletteYellowForeground2 }}
                >
                  Maximum selection reached
                </Text>
              )}
            </div>
          )} */}

          {/* Search Input with Popover */}
          <Popover
            withArrow
            positioning="below-start"
            open={shouldShowPopover}
            onOpenChange={(event, data) => {
              void event;
              setIsOpen(data.open);
            }}
          >
            <PopoverTrigger disableButtonEnhancement>
              <Input
                ref={inputRef}
                placeholder={
                  isMaxSelectionReached
                    ? "Maximum selection reached"
                    : placeholder
                }
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                disabled={Boolean(disabled) || Boolean(isMaxSelectionReached)}
                contentBefore={
                  multiple ? <PeopleRegular /> : <PersonAddRegular />
                }
                contentAfter={
                  selectedPeopleState.length > 0 ? (
                    <ChevronDownRegular />
                  ) : undefined
                }
                className={styles.inputWithIcon}
                aria-describedby={
                  description ? `${label}-description` : undefined
                }
                aria-invalid={!!errorMessage}
              />
            </PopoverTrigger>

            <PopoverSurface
              style={{ padding: 0, minWidth: "320px", maxWidth: "400px" }}
            >
              <div className={styles.searchResults}>
                <SearchResults
                  searchResult={searchResult}
                  searchQuery={searchQuery}
                  selectedPeople={selectedPeopleState}
                  onPersonSelect={handlePersonSelect}
                  minSearchLength={minSearchLength}
                  showPresence={showPresence}
                  recentlySelected={recentlySelected}
                  showRecentlySelected={showRecentlySelected}
                />
              </div>
            </PopoverSurface>
          </Popover>

          {/* Selected People List */}
          <SelectedPeopleList
            selectedPeople={selectedPeopleState}
            onRemovePerson={handlePersonRemove}
            disabled={disabled}
            compact={compact}
            showPresence={showPresence}
          />
        </div>
      </Field>
    </div>
  );
};

// Enhanced Single-Select People Picker Component
const PeoplePicker: React.FC<PeoplePickerProps> = ({
  placeholder = "Search for a person...",
  selectedPerson = null,
  onSelectionChanged = () => {},
  disabled = false,
  required = false,
  label = "Person",
  description = "",
  errorMessage = "",
  minSearchLength = 2,
  searchDelay = 300,
  showPresence = false,
  showRecentlySelected = false,
  recentlySelectedLimit = 5,
}) => {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPersonState, setSelectedPersonState] = useState<Person | null>(
    selectedPerson
  );
  const { accessToken }: any = useAuth();
  const [searchResult, setSearchResult] = useState<SearchResult>({
    results: [],
    isLoading: false,
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recentlySelected, setRecentlySelected] = useState<Person[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recently selected from localStorage
  useEffect(() => {
    if (showRecentlySelected) {
      const stored = localStorage.getItem("recentlySelectedPerson");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRecentlySelected(parsed.slice(0, recentlySelectedLimit));
        } catch (e) {
          console.error("Failed to parse recently selected person", e);
        }
      }
    }
  }, [showRecentlySelected, recentlySelectedLimit]);

  // Save to recently selected
  const saveToRecentlySelected = useCallback(
    (person: Person) => {
      if (!showRecentlySelected) return;

      const updated = [
        person,
        ...recentlySelected.filter((p) => p.id !== person.id),
      ].slice(0, recentlySelectedLimit);

      setRecentlySelected(updated);
      localStorage.setItem("recentlySelectedPerson", JSON.stringify(updated));
    },
    [recentlySelected, showRecentlySelected, recentlySelectedLimit]
  );

  // Sync internal state with prop changes
  useEffect(() => {
    setSelectedPersonState(selectedPerson);
  }, [selectedPerson]);

  // Search function with error handling
  const searchPeople = async (query: string): Promise<void> => {
    if (query.length < minSearchLength) {
      setSearchResult({ results: [], isLoading: false });
      return;
    }

    setSearchResult((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const results = await fetchUsers(query, accessToken);
      // Filter out already selected person
      const filteredResults = results.filter(
        (person: any) =>
          !selectedPersonState || selectedPersonState.id !== person.id
      );

      setSearchResult({
        results: filteredResults,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      setSearchResult({
        results: [],
        isLoading: false,
        error: "Failed to search people. Please try again.",
      });
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPeople(searchQuery);
      }, searchDelay);
    } else {
      setSearchResult({ results: [], isLoading: false });
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedPersonState, searchDelay, minSearchLength]);

  // Handle person selection
  const handlePersonSelect = (person: Person): void => {
    setSelectedPersonState(person);
    onSelectionChanged(person);
    setSearchQuery("");
    setIsOpen(false);
    saveToRecentlySelected(person);

    // Focus back to input for better UX
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Handle person removal
  const handlePersonRemove = (): void => {
    setSelectedPersonState(null);
    onSelectionChanged(null);

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Handle input change
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearchQuery(event.target.value);
    setIsOpen(true);
  };

  // Handle input focus
  const handleInputFocus = (): void => {
    setIsOpen(true);
  };

  // Render selected person card
  const renderSelectedPerson = (): JSX.Element | null => {
    if (!selectedPersonState) return null;

    return (
      <div className={styles.selectedPersonCard}>
        <AvatarWithPresence
          person={selectedPersonState}
          size={40}
          showPresence={showPresence}
        />
        <div className={styles.selectedPersonInfo}>
          <Text weight="semibold" size={300}>
            {selectedPersonState.displayName}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {selectedPersonState.email}
          </Text>
          {selectedPersonState.title && (
            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
              {selectedPersonState.title}
              {selectedPersonState.department &&
                ` • ${selectedPersonState.department}`}
            </Text>
          )}
        </div>
        <Tooltip content="Remove person" relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={<DismissRegular />}
            onClick={handlePersonRemove}
            disabled={disabled}
            aria-label={`Remove ${selectedPersonState.displayName}`}
          />
        </Tooltip>
      </div>
    );
  };

  const shouldShowPopover =
    isOpen &&
    !selectedPersonState &&
    (searchQuery.length > 0 ||
      searchResult.results.length > 0 ||
      (showRecentlySelected && recentlySelected.length > 0));

  return (
    <div className={styles.container}>
      <Field
        label={
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <PersonRegular fontSize={16} />
            {label}
          </div>
        }
        required={required}
        validationMessage={errorMessage}
        hint={description}
      >
        <div className={styles.inputContainer}>
          <Popover
            withArrow
            positioning="below-start"
            open={shouldShowPopover}
            onOpenChange={(event, data) => {
              void event;
              setIsOpen(data.open);
            }}
          >
            <PopoverTrigger disableButtonEnhancement>
              <Input
                ref={inputRef}
                placeholder={
                  selectedPersonState
                    ? "Clear selection to search again"
                    : placeholder
                }
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                disabled={disabled || !!selectedPersonState}
                contentBefore={<SearchRegular />}
                className={styles.inputWithIcon}
                aria-describedby={
                  description ? `${label}-description` : undefined
                }
                aria-invalid={!!errorMessage}
              />
            </PopoverTrigger>

            <PopoverSurface
              style={{ padding: 0, minWidth: "320px", maxWidth: "400px" }}
            >
              <div className={styles.searchResults}>
                <SearchResults
                  searchResult={searchResult}
                  searchQuery={searchQuery}
                  selectedPeople={
                    selectedPersonState ? [selectedPersonState] : []
                  }
                  onPersonSelect={handlePersonSelect}
                  minSearchLength={minSearchLength}
                  showPresence={showPresence}
                  recentlySelected={recentlySelected}
                  showRecentlySelected={showRecentlySelected}
                />
              </div>
            </PopoverSurface>
          </Popover>
          {renderSelectedPerson()}
        </div>
      </Field>
    </div>
  );
};

// Export everything
export default MultiSelectPeoplePicker;
export { PeoplePicker };
export type { Person, PeoplePickerProps };
export {
  SelectedPersonChip,
  SelectedPeopleList,
  PersonSearchItem,
  SearchResults,
  AvatarWithPresence,
};
