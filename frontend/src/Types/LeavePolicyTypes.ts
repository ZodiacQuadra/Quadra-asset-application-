export interface LeavePolicy {
    id?:string;
    name: string;
    days: number;
    createdBy: string;
    createdAt: Date;
    isDisabled: boolean;
    isOptional:boolean
}