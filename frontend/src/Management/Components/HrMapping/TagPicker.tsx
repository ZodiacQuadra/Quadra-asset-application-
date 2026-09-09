import * as React from "react";
import {
  Combobox,
  makeStyles,
  Option,
  Tag,
  TagGroup,
  useId,
} from "@fluentui/react-components";
import type { ComboboxProps, TagGroupProps } from "@fluentui/react-components";
import { EntraDepartment } from "../../../Services/Department";

const useStyles = makeStyles({
  root: {
    display: "grid",
    gridTemplateRows: "repeat(1fr)",
    justifyItems: "start",
    gap: "8px",
    maxWidth: "400px",
  },
  tagGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
});

interface MultiselectProps extends Partial<ComboboxProps> {
  options?: EntraDepartment[];
  onSelectionChange?: (selectedDepartments: EntraDepartment[]) => void;
  selectedValues?: string[];
}

export const Multiselect = (props: MultiselectProps) => {
  const comboId = useId("combo-multi");
  const selectedListId = `${comboId}-selection`;
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>(props.selectedValues || []);
  const styles = useStyles();

  // Sync selectedOptions when selectedValues prop changes
  React.useEffect(() => {
    if (props.selectedValues) {
      setSelectedOptions(props.selectedValues);
    }
  }, [props.selectedValues]);

  const onSelect: ComboboxProps["onOptionSelect"] = (_event, data) => {
    const newSelectedOptions = data.selectedOptions;
    setSelectedOptions(newSelectedOptions);

    // Notify parent component with full department objects
    if (props.onSelectionChange) {
      const selectedDepartments = newSelectedOptions
        .map((id) => props.options?.find((opt) => opt.Id === id))
        .filter((dept): dept is EntraDepartment => dept !== undefined);
      props.onSelectionChange(selectedDepartments);
    }
  };

  const onTagDismiss: TagGroupProps["onDismiss"] = (_e, data) => {
    const newSelectedOptions = selectedOptions.filter(
      (option) => option !== data.value
    );
    setSelectedOptions(newSelectedOptions);

    // Notify parent component with updated departments
    if (props.onSelectionChange) {
      const selectedDepartments = newSelectedOptions
        .map((id) => props.options?.find((opt) => opt.Id === id))
        .filter((dept): dept is EntraDepartment => dept !== undefined);
      props.onSelectionChange(selectedDepartments);
    }
  };

  const labelledBy =
    selectedOptions.length > 0 ? `${comboId} ${selectedListId}` : comboId;

  return (
    <div style={{ width: "100%" }}>
      <Combobox
        aria-labelledby={labelledBy}
        multiselect={true}
        placeholder="Select one or more departments"
        selectedOptions={selectedOptions}
        onOptionSelect={onSelect}
        {...props}
        style={{ width: "100%" }}
      >
        {props.options?.map((option) => (
          <Option key={option.Id} value={option.Id}>
            {option.Name}
          </Option>
        ))}
      </Combobox>
      {selectedOptions.length > 0 && (
        <TagGroup
          id={selectedListId}
          className={styles.tagGroup}
          aria-label="Selected departments"
          onDismiss={onTagDismiss}
          style={{marginTop:"10px"}}
        >
          {selectedOptions.map((optionId) => {
            const department = props.options?.find((opt) => opt.Id === optionId);
            return (
              <Tag
                key={optionId}
                dismissible
                value={optionId}
              >
                {department?.Name || optionId}
              </Tag>
            );
          })}
        </TagGroup>
      )}
    </div>
  );
};