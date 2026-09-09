import React, { useState, useEffect, FC } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Textarea,
  Checkbox,
  Field,
  Combobox,
  Spinner,
  Option,
  Persona,
  ComboboxProps,
  Card,
} from "@fluentui/react-components";
import { searchUsersWithDetails, UserDetails } from "../../../Services/Offboarding";
import { useAuth } from "../../../Auth/AuthProvider";
import { Person } from "../../../Types/interview";
import { Dismiss12Regular } from "@fluentui/react-icons";

interface InterviewStage {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  order: number;
  show: boolean;
  isManual: boolean;
  notify: boolean;
  notifyUsers:Person[]
}

interface StageFormData {
  name: string;
  description: string;
  show: boolean;
  isManual: boolean;
  notify: boolean;
  notifyUsers?: Person[]
}

interface StageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StageFormData) => void;
  stage?: InterviewStage | null;
  title: string;
  description: string;
  
}

interface FormErrors {
  name?: string;
  description?: string;
  notify?:string
}

interface UserComboboxProps {
  label: string;
  placeholder: string;
  value: string;
  onUserSelect: (user: UserDetails | null) => void;
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
  icon?: React.ReactNode;
}

const getInitialFormState = (stage?: InterviewStage | null): StageFormData => {
  if (stage) {
    return {
      name: stage.name,
      description: stage.description,
      show: stage.show,
      isManual: stage.isManual,
      notify: stage.notify,
      notifyUsers:stage.notifyUsers
    };
  }
  return {
    name: "",
    description: "",
    show: true,
    isManual: false,
    notify: false,
    notifyUsers:[]
  };
};

const UserCombobox: FC<UserComboboxProps> = ({
  label,
  placeholder,
  value,
  onUserSelect,
  required = false,
  disabled = false,
  validationState = "none",
  validationMessage,
  icon,
}) => {
  const [query, setQuery] = useState<string>(value);
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { accessToken }: any = useAuth();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2 || disabled) {
        setUsers([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      setIsOpen(true);
      try {
        const results = await searchUsersWithDetails(query, accessToken);
        setUsers(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Error searching users:", error);
        setUsers([]);
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, disabled, accessToken]);

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedUser = users.find((u) => u.id === data.optionValue);
    if (selectedUser) {
      setQuery(selectedUser.displayName);
      onUserSelect(selectedUser);
      setIsOpen(false);
    }
  };

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value;
    setQuery(newValue);

    if (!newValue) {
      onUserSelect(null);
      setUsers([]);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Option text="Searching..." disabled>
          <div className="flex items-center gap-2">
            <Spinner size="tiny" />
            Searching...
          </div>
        </Option>
      );
    }

    if (disabled) {
      return (
        <Option text="Field is disabled" disabled>
          Field is disabled
        </Option>
      );
    }

    if (query.length < 2) {
      return (
        <Option text="Type at least 2 characters to search" disabled>
          Type at least 2 characters to search
        </Option>
      );
    }

    if (users.length === 0 && query.length >= 2) {
      return (
        <Option text={`No users found matching "${query}"`} disabled>
          No users found matching "{query}"
        </Option>
      );
    }

    return users.map((user) => (
      <Option key={user.id} value={user.id} text={user.displayName}>
        <Persona
          avatar={{ color: "colorful", "aria-hidden": true }}
          name={user.displayName}
          secondaryText={user.email}
        />
      </Option>
    ));
  };


  

  return (
    <Field
      orientation="vertical"
      label={
        <>
          {icon} {label}
        </>
      }
      required={required}
      className="flex-1 w-full"
      validationState={validationState}
      validationMessage={validationMessage}
    >
      <Combobox
        className="w-full min-w-[100px]"
        onOptionSelect={onOptionSelect}
        placeholder={placeholder}
        onChange={handleInputChange}
        value={query}
        disabled={disabled}
        open={isOpen}
        onOpenChange={(e, data) => setIsOpen(data.open)}
      >
        {renderContent()}
      </Combobox>
    </Field>
  );
};


const StageForm: React.FC<StageFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stage,
  title,
  description,
}) => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifyingUser,setNotifyingUser] = useState<Person | null>(null)
  const [addedNotifyingUser,setAddedNotifyingUser] = useState<Person[]>([])
  const [form, setForm] = useState<StageFormData>(getInitialFormState(stage));


  useEffect(() => {
    if (isOpen) {
      setForm(getInitialFormState(stage));
      if(stage){

        setAddedNotifyingUser(stage.notifyUsers??[])
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [stage, isOpen]);

  const handleChange = (
    field: keyof StageFormData,
    value: string | boolean
  ) => {
    if(field === "notify"){
      const boolValue = value as boolean;
      if (boolValue === false){
        setForm((prev) => ({ ...prev, notify: boolValue, notifyUsers:[] }));
        setNotifyingUser(null)
      }
      else{
        setForm((prev) => ({ ...prev, notify: boolValue}));
      }
    }
    else if(field ==="isManual"){
      const booleanValue = value as boolean
      if(booleanValue === false){
          setForm((prev) => ({ ...prev, notify: booleanValue, notifyUsers:[] }));
          setNotifyingUser(null)
      }
      
      setForm((prev) => ({ ...prev, [field]: booleanValue }));
    }
    else{

      setForm((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error for the field being edited
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Stage name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Stage name must be at least 2 characters";
    } else if (form.name.trim().length > 50) {
      newErrors.name = "Stage name must be less than 50 characters";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.trim().length < 5) {
      newErrors.description = "Description must be at least 5 characters";
    } else if (form.description.trim().length > 200) {
      newErrors.description = "Description must be less than 200 characters";
    }

    if (form.notify){
      if(addedNotifyingUser.length<1){
        newErrors.notify = "Add atleast one user to trigger notification"
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleNotifingUsersSelect = (person: Person | null) =>{
    setNotifyingUser(person)
  }

  const handleAddNotifyingUser = () =>{
    if(notifyingUser && !addedNotifyingUser.find((item)=>item.email === notifyingUser.email)){
      setAddedNotifyingUser((perValue)=>([...perValue,notifyingUser]))
      setNotifyingUser(null)
    }
  }

  const handleRemoveNotifingUser = (index:number) => {
    const person = addedNotifyingUser[index]
    setAddedNotifyingUser((prevValue)=>(
      prevValue.filter(item=>item.id !== person.id)
    ))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Trim whitespace from string fields
      const trimmedData = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if(form.notify){
        trimmedData["notifyUsers"] = addedNotifyingUser
      }

      onSubmit(trimmedData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting

    setForm(getInitialFormState(stage));
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleDialogOpenChange = (event: any, data: { open: boolean }) => {
    if (!data.open && !isSubmitting) {
      handleClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      modalType="alert"
      onOpenChange={handleDialogOpenChange}
    >
      <DialogSurface className="max-w-md">
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <p className="text-sm text-gray-600 mb-6">{description}</p>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <Field
                label="Stage Name"
                validationMessage={errors.name}
                validationState={errors.name ? "error" : "none"}
                required
              >
                <Input
                  value={form.name}
                  onChange={(_, data) => handleChange("name", data.value)}
                  placeholder="Enter stage name (e.g., Phone Interview)"
                  disabled={isSubmitting}
                  maxLength={50}
                />
              </Field>

              <Field
                label="Description"
                validationMessage={errors.description}
                validationState={errors.description ? "error" : "none"}
                required
              >
                <Textarea
                  value={form.description}
                  onChange={(_, data) =>
                    handleChange("description", data.value)
                  }
                  placeholder="Enter stage description (e.g., Initial phone screening with HR)"
                  rows={3}
                  resize="vertical"
                  disabled={isSubmitting}
                  maxLength={200}
                />
              </Field>

              <div className="space-y-4">
                <Field label="Stage Options">
                  <div className="flex flex-col space-y-3">
                    <Field>
                      {" "}
                      <Checkbox
                        checked={form.show}
                        onChange={(_, data) =>
                          handleChange("show", data.checked === true)
                        }
                        label="Show in UI"
                        disabled={isSubmitting}
                      />
                      <div className="text-xs text-gray-500 ml-6 mt-1">
                        Show this stage in the interview pipeline
                      </div>
                    </Field>
                    <Field>
                      {" "}
                      <Checkbox
                        checked={form.isManual}
                        onChange={(_, data) =>
                          handleChange("isManual", data.checked === true)
                        }
                        label="Direct Decision"
                        disabled={isSubmitting}
                      />
                      <div className="text-xs text-gray-500 ml-6 mt-1">
                        Requires manual progression to the next stage
                      </div>
                    </Field>
                    {
                      form.isManual && (
                        <Field>
                      {" "}
                      <Checkbox
                        checked={form.notify}
                        onChange={(_, data) =>
                          handleChange("notify", data.checked === true)
                        }
                        label="Trigger Notification"
                        disabled={isSubmitting}
                      />
                      <div className="text-xs text-gray-500 ml-6 mt-1">
                        Trigger notification for manual review
                      </div>
                    </Field>
                      )
                    }
                    
                  </div>
                </Field>

                {
                  form.notify && (
                    <div className="flex flex-col gap-5">
                    <div className="flex gap-5 items-end justify-between">
                    <UserCombobox
                                    label="Notify users"
                                    placeholder="Search for users"
                                    value={notifyingUser?.displayName || ""}
                                    onUserSelect={(user) => {
                                      if (user) {
                                        handleNotifingUsersSelect({
                                          id: user.id,
                                          displayName: user.displayName,
                                          email: user.email,
                                        });
                                      } else {
                                        handleNotifingUsersSelect(null);
                                      }
                                    }}
                                    
                                    disabled={false}
                                    // validationState={getValidationState("reportingManager")}
                                    // validationMessage={errors.reportingManager}
                                  />
                              <Button color="primary" disabled={notifyingUser?false:true} size="medium" onClick={()=>handleAddNotifyingUser()}>Add</Button>
                    </div>
                  { addedNotifyingUser.length>0 && 
                  <div className="flex flex-col gap-3">   
                    <div className="flex gap-3">            
                      {
                        addedNotifyingUser.slice(0,1).map((item,index)=>(
                          <div className="border-1 rounded-2xl border-gray-100 flex items-center w-fit gap-2 p-1 !bg-green-100 !text-green-500">
                            <Persona
                              size="small"
                              title={item.displayName}
                              primaryText={item.displayName}
                              textAlignment="center"
                              
                            />

                            <Dismiss12Regular className="cursor-pointer text-red-700" onClick={()=>handleRemoveNotifingUser(index)}/>
                          </div>
                        ))
                      }

                      {
                        addedNotifyingUser.slice(1,addedNotifyingUser.length).map((item,index)=>(
                          <div className="border-1 rounded-2xl border-gray-100 flex items-center w-fit gap-3 p-1 bg-purple-100">
                            <Persona
                              size="small"
                              title={item.displayName}
                              primaryText={item.displayName}
                              textAlignment="center"

                            />

                            <Dismiss12Regular className="cursor-pointer text-red-700" onClick={()=>handleRemoveNotifingUser(index)}/>
                          </div>
                        ))
                      }

                    </div>

                    </div>
                    }


                    </div>
                  )
                }


              </div>

              <DialogActions className="mt-8">
                <Button
                  appearance="secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  appearance="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : stage
                    ? "Update Stage"
                    : "Add Stage"}
                </Button>
              </DialogActions>
            </form>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default StageForm;
