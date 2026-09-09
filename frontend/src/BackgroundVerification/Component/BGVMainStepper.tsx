import React from 'react';
import {
    makeStyles,
    tokens,
    Text,
    mergeClasses,
} from '@fluentui/react-components';
import { CheckmarkFilled } from '@fluentui/react-icons';

interface StepsType{
    label: string;
    icon: React.ReactNode;
}

interface BGVMainStepperProps {
    activeStep: number;
    steps: StepsType[];
    handleStep:(index:number)=>void;
}

const useStyles = makeStyles({
    stepper: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        padding: `${tokens.spacingVerticalXL} 0`,
    },
    stepContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        position: 'relative',
        minWidth: '100px',
        cursor: 'pointer'
    },
    stepIndicator: {
        width: '40px',
        height: '40px',
        borderRadius: tokens.borderRadiusCircular,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: tokens.fontWeightSemibold,
        fontSize: tokens.fontSizeBase400,
        transition: 'all 0.3s ease',
        zIndex: 1,
        flexShrink: 0,
    },
    stepInactive: {
        backgroundColor: tokens.colorNeutralBackground3,
        color: tokens.colorNeutralForeground2,
    },
    stepActive: {
        backgroundColor: "#0153A5",
        color: tokens.colorNeutralForegroundInverted,
        boxShadow: tokens.shadow4,
    },
    stepCompleted: {
        backgroundColor: "#21A251",
        color: tokens.colorNeutralForegroundInverted,
    },
    stepLabel: {
        marginTop: tokens.spacingVerticalS,
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightSemibold,
        textAlign: 'center',
        maxWidth: '150px',
        lineHeight: '1.4',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        hyphens: 'auto',
    },
    stepLabelActive: {
        color: "#000",
    },
    stepLabelCompleted: {
        color: "#6B7280",
        fontWeight:400,
    },
    stepLabelInactive: {
        color: "#6B7280",
        fontWeight:400,
    },
    connector: {
        position: 'absolute',
        top: '20px',
        left: '50%',
        right: '-50%',
        height: '2px',
        backgroundColor: tokens.colorNeutralStroke2,
        zIndex: 0,
    },
    connectorCompleted: {
        backgroundColor: tokens.colorPaletteGreenBackground3,
    },
});

const BGVMainStepper: React.FC<BGVMainStepperProps> = ({ activeStep, steps,handleStep }) => {
    const styles = useStyles();

    return (
        <div  className={styles.stepper}>
            {steps.map((step, index) => {
                const isCompleted = activeStep > index;
                const isActive = activeStep === index;
                const isConnectorCompleted = activeStep > index;

                return (
                    <div role='button' onClick={()=>handleStep(index)} key={step.label} className={styles.stepContainer}>
                        {index < steps.length - 1 && (
                            <div
                                className={mergeClasses(
                                    styles.connector,
                                    isConnectorCompleted && styles.connectorCompleted
                                )}
                            />
                        )}
                        <div
                            className={mergeClasses(
                                styles.stepIndicator,
                                isCompleted && styles.stepCompleted,
                                isActive && styles.stepActive,
                                !isCompleted && !isActive && styles.stepInactive
                            )}
                        >
                            {<span>{step.icon}</span>}
                        </div>
                        <Text
                            className={mergeClasses(
                                styles.stepLabel,
                                isCompleted && styles.stepLabelCompleted,
                                isActive && styles.stepLabelActive,
                                !isCompleted && !isActive && styles.stepLabelInactive
                            )}
                        >
                            {step.label}
                        </Text>
                    </div>
                );
            })}
        </div>
    );
};

export default BGVMainStepper;