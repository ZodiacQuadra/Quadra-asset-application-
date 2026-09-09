import React, { useState, useRef, useEffect } from "react";
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
} from "@fluentui/react-components";
import {
  PersonRegular,
  DismissRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import { fetchUsers } from "../../Services/GraphAPI";
import { useAuth } from "../../Auth/AuthProvider";

// Type definitions
interface Person {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
}

interface PeoplePickerProps {
  placeholder?: string;
  selectedPerson?: Person | null;
  onSelectionChanged?: (person: Person | null) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  description?: string;
  errorMessage?: string;
  searchFunction?: (query: string) => Promise<Person[]>;
  minSearchLength?: number;
  searchDelay?: number;
}

interface SearchResult {
  results: Person[];
  isLoading: boolean;
  error?: string;
}

// Styles
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
  selectedPersonCard: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalXS,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  selectedPersonInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  searchResults: {
    maxHeight: "200px",
    overflowY: "auto",
    padding: tokens.spacingVerticalS,
  },
  personItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    cursor: "pointer",
    borderRadius: tokens.borderRadiusMedium,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  personInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  emptyState: {
    padding: tokens.spacingVerticalM,
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
  },
  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalM,
    gap: tokens.spacingHorizontalS,
  },
  errorState: {
    padding: tokens.spacingVerticalM,
    textAlign: "center",
    color: tokens.colorPaletteRedForeground1,
  },
});

// Default search function
const defaultSearchFunction = async (
  query: string,
  accessToken: string
): Promise<Person[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return fetchUsers(query, accessToken);
};

// Main PeoplePicker component
const PeoplePicker: React.FC<PeoplePickerProps> = ({
  placeholder = "Search for a person...",
  selectedPerson = null,
  onSelectionChanged = () => {},
  disabled = false,
  required = false,
  label = "",
  description = "",
  errorMessage = "",
  searchFunction = defaultSearchFunction,
  minSearchLength = 2,
  searchDelay = 300,
}) => {
  // console.log(selectedPerson);
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPersonState, setSelectedPersonState] = useState<Person | null>(
    selectedPerson
  );
  const [searchResult, setSearchResult] = useState<SearchResult>({
    results: [],
    isLoading: false,
  });
  const { accessToken }: any = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ADD THIS: Sync internal state with prop changes
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
      const results = await searchFunction(query, accessToken);
      // Filter out already selected person
      const filteredResults = results.filter(
        (person) => !selectedPersonState || selectedPersonState.id !== person.id
      );

      setSearchResult({
        results: filteredResults,
        isLoading: false,
      });
    } catch (error) {
      setSearchResult({
        results: [],
        isLoading: false,
        error: "Failed to search people",
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
  };

  // Handle person removal
  const handlePersonRemove = (): void => {
    setSelectedPersonState(null);
    onSelectionChanged(null);
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

  // Get avatar initials
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Render selected person card
  const renderSelectedPerson = (): JSX.Element | null => {
    if (!selectedPersonState) return null;

    return (
      <div className={styles.selectedPersonCard}>
        <Avatar
          name={selectedPersonState.displayName}
          image={
            selectedPersonState.avatar
              ? { src: selectedPersonState.avatar }
              : undefined
          }
          size={24}
        />
        <div className={styles.selectedPersonInfo}>
          <Text weight="semibold" size={200}>
            {selectedPersonState.displayName}
          </Text>
          <Text size={100} style={{ color: tokens.colorNeutralForeground2 }}>
            {selectedPersonState.email}
          </Text>
        </div>
        <Button
          appearance="subtle"
          size="small"
          icon={<DismissRegular />}
          onClick={handlePersonRemove}
          disabled={disabled}
          title="Remove person"
          aria-label={`Remove ${selectedPersonState.displayName}`}
        />
      </div>
    );
  };

  // Render search results
  const renderSearchResults = (): JSX.Element => {
    if (searchResult.isLoading) {
      return (
        <div className={styles.loadingState}>
          <Spinner size="small" />
          <Text>Searching...</Text>
        </div>
      );
    }

    if (searchResult.error) {
      return (
        <div className={styles.errorState}>
          <Text>{searchResult.error}</Text>
        </div>
      );
    }

    if (searchResult.results.length > 0) {
      return (
        <>
          {searchResult.results.map((person) => (
            <div
              key={person.id}
              className={`${styles.personItem} shadow-xs`}
              onClick={() => handlePersonSelect(person)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePersonSelect(person);
                }
              }}
              aria-label={`Select ${person.displayName}`}
            >
              <Avatar
                name={person.displayName}
                image={person.avatar ? { src: person.avatar } : undefined}
                size={32}
              />
              <div className={styles.personInfo}>
                <Text weight="semibold">{person.displayName}</Text>

                <Text
                  size={100}
                  style={{ color: tokens.colorNeutralForeground3 }}
                >
                  {person.email}
                </Text>
              </div>
            </div>
          ))}
        </>
      );
    }

    if (searchQuery.length >= minSearchLength) {
      return (
        <div className={styles.emptyState}>
          <PersonRegular />
          <Text>No person found for "{searchQuery}"</Text>
        </div>
      );
    }

    return (
      <div className={styles.emptyState}>
        <Text>Type at least {minSearchLength} characters to search</Text>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Field label={label} required={required} validationMessage={errorMessage}>
        <div className={styles.inputContainer}>
          <Popover
            withArrow
            open={
              isOpen &&
              (searchQuery.length > 0 || searchResult.results.length > 0)
            }
            onOpenChange={(event, data) => setIsOpen(data.open)}
          >
            <PopoverTrigger disableButtonEnhancement>
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                disabled={disabled}
                contentBefore={<SearchRegular />}
                aria-describedby={
                  description ? `${label}-description` : undefined
                }
                aria-invalid={!!errorMessage}
              />
            </PopoverTrigger>

            <PopoverSurface className="!p-0 max-h-72 overflow-y-auto ">
              <div className={styles.searchResults}>
                {renderSearchResults()}
              </div>
            </PopoverSurface>
          </Popover>
          {renderSelectedPerson()}
        </div>
      </Field>
    </div>
  );
};

export default PeoplePicker;
export type { Person, PeoplePickerProps };
