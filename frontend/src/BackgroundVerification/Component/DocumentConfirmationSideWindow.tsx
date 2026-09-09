import { Button, DialogActions, DrawerBody, DrawerHeader, DrawerHeaderTitle, OverlayDrawer } from "@fluentui/react-components";
import { FileData } from "../Pages/EmployeeBGVForm";
import { Dismiss24Regular } from "@fluentui/react-icons";
import React, { useEffect, useRef, useState } from "react";

interface propsTypes{
    open:boolean,
    setOpen:(state:boolean)=>void,
    uploadedFiles:{ [key: string]: FileData[] },
    handleFormSubmit:()=>void
}

const DocumentConfirmation= (props:propsTypes) => {

    const [objectUrlMap, setObjectUrlMap] = useState<Record<string,string>>({});
    const urlsCreatedRef = useRef<Set<string>>(new Set());

    // console.log("Rendered DocumentConfirmationSideWindow",props.uploadedFiles);

    // Create object URLs in effect to avoid re-renders during render
    useEffect(() => {
        const newUrls: Record<string, string> = {};
        
        Object.values(props.uploadedFiles).flat().forEach(file => {
            if (!file) return;
            
            // Skip if already have a URL for this file
            if (objectUrlMap[file.id]) return;
            
            // If file has blobStoragePath, use it directly
            if (file.blobStoragePath) {
                newUrls[file.id] = file.blobStoragePath;
                return;
            }
            
            // Otherwise create object URL from File
            if (file.file instanceof File) {
                const url = URL.createObjectURL(file.file);
                newUrls[file.id] = url;
                urlsCreatedRef.current.add(url); // Track for cleanup
            }
        });

        if (Object.keys(newUrls).length > 0) {
            setObjectUrlMap(prev => ({ ...prev, ...newUrls }));
        }
    }, [props.uploadedFiles, objectUrlMap]);

    const GenerateUrl = (fileData: FileData): string => {
        try {
            // Return cached URL if available
            if (objectUrlMap[fileData.id]) {
                return objectUrlMap[fileData.id];
            }
            
            // Return blob storage path if available
            if (fileData.blobStoragePath) {
                return fileData.blobStoragePath;
            }
            
            // Mark as pending if File object exists but URL not yet created
            if (fileData.file instanceof File) {
                return `pending:///${fileData.id}`;
            }
        } catch (error) {
            console.log('URL generation error:', error);
        }
        return "";
    };

    const FilePreview: React.FC<{ file: FileData; src: string }> = React.memo(({ file, src }) => {
        const [imgLoaded, setImgLoaded] = useState(false);
        const [imgError, setImgError] = useState(false);
        const [urlAccessible, setUrlAccessible] = useState<boolean | null>(null);
        const [isCheckingUrl, setIsCheckingUrl] = useState(false);

        // Check if remote URL is accessible (for blob storage paths)
        useEffect(() => {
            if (!src || src.startsWith('pending://') || src.startsWith('blob:')) {
                setUrlAccessible(null);
                setIsCheckingUrl(false);
                return;
            }
            
            let isMounted = true;
            setIsCheckingUrl(true);
            
            const checkUrl = async () => {
                try {
                    const response = await fetch(src, { method: 'HEAD', mode: 'no-cors' });
                    if (isMounted) {
                        setUrlAccessible(true);
                        setIsCheckingUrl(false);
                    }
                } catch (error) {
                    // For no-cors mode, we can't reliably check, so assume accessible
                    // The actual rendering will determine if it loads
                    if (isMounted) {
                        setUrlAccessible(true);
                        setIsCheckingUrl(false);
                    }
                }
            };
            
            checkUrl();
            return () => { isMounted = false; };
        }, [src]);

        // Don't render if src is empty or pending
        if (!src || src.startsWith('pending://')) {
            return (
                <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                }}>
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #e5e7eb',
                            borderTopColor: '#4f46e5',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 8px'
                        }}></div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Loading preview...</p>
                    </div>
                </div>
            );
        }

        // Show loading while checking URL accessibility
        if (isCheckingUrl) {
            return (
                <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                }}>
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #e5e7eb',
                            borderTopColor: '#4f46e5',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 8px'
                        }}></div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Checking file availability...</p>
                    </div>
                </div>
            );
        }

        const fileName = (file.name || 'document').toLowerCase();
        const fileType = (file.type || '').toLowerCase();
        
        const isImage = fileType.includes('image') || 
                       /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
        const isPdf = fileType.includes('pdf') || fileName.endsWith('.pdf');

        // Image files
        if (isImage && src && !imgError) {
            return (
                <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    border: '2px solid #e5e7eb', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    backgroundColor: 'white',
                    height:"300px"
                }}>
                    <div style={{ 
                        backgroundColor: '#f9fafb', 
                        padding: '16px', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        overflow: 'auto'
                    }}>
                        {!imgLoaded && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '3px solid #e5e7eb',
                                    borderTopColor: '#4f46e5',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    margin: '0 auto 8px'
                                }}></div>
                                <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading image...</p>
                            </div>
                        )}
                        <img 
                            src={src} 
                            alt={file.name}
                            style={{ 
                                maxHeight: '100%', 
                                maxWidth: '100%', 
                                objectFit: 'contain',
                                display: imgLoaded ? 'block' : 'none'
                            }}
                            onLoad={() => setImgLoaded(true)}
                            onError={() => { setImgError(true); setImgLoaded(true); }}
                        />
                    </div>
                    <div style={{ padding: '12px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Image File</p>
                    </div>
                </div>
            );
        }

        // Image load error fallback
        if (isImage && imgError) {
            return (
                <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    border: '2px solid #fecaca', 
                    borderRadius: '8px', 
                    backgroundColor: '#fee2e2',
                    height:"300px"
                }}>
                    <div style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                        <svg 
                            style={{ width: '48px', height: '48px', color: '#dc2626', margin: '0 auto 12px' }}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                            />
                        </svg>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#7f1d1d', margin: '0 0 8px 0' }}>
                            {file.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#991b1b', margin: '0 0 12px 0' }}>
                            Image could not be loaded
                        </p>
                        {src && (
                            <a 
                                href={src} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    textDecoration: 'none',
                                    fontWeight: '500'
                                }}
                            >
                                Open Image
                            </a>
                        )}
                    </div>
                </div>
            );
        }

        // PDF files
        if (isPdf && src) {
            return (
                <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    border: '2px solid #e5e7eb', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    backgroundColor: 'white' ,
                    height:"300px"
                }}>
                    <div style={{ backgroundColor: '#f3f4f6', position: 'relative', flex: 1, overflow: 'auto' }}>
                        <iframe 
                            src={`${src}#toolbar=0`}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title={file.name}
                            onError={() => setImgError(true)}
                        />
                        {imgError && (
                            <div style={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                bottom: 0, 
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}>
                                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>PDF preview not available</p>
                                <a 
                                    href={src} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#4f46e5',
                                        color: 'white',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        textDecoration: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    Open in new tab
                                </a>
                            </div>
                        )}
                    </div>
                    <div style={{ padding: '12px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>PDF Document</p>
                            <a 
                                href={src} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ fontSize: '12px', color: '#4f46e5', textDecoration: 'none' }}
                            >
                                Open in new tab →
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        // All other files - show with download/open options
        return (
            <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                border: '2px solid #dbeafe', 
                borderRadius: '8px', 
                backgroundColor: '#eff6ff',
                overflow: 'hidden',
                height:"300px"
            }}>
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, overflow: 'auto' }}>
                    <div>
                        <svg 
                            style={{ width: '64px', height: '64px', color: '#60a5fa', margin: '0 auto 12px', display: 'block' }}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
                            />
                        </svg>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a', margin: '0 0 8px 0', textAlign: 'center' }}>
                            {file.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#3b82f6', margin: '0 0 16px 0', textAlign: 'center' }}>
                            ✓ File uploaded successfully
                        </p>
                        {src && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <a 
                                    href={src} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#4f46e5',
                                        color: 'white',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        textDecoration: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    Open File
                                </a>
                                <a 
                                    href={src} 
                                    download={file.name}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#e5e7eb',
                                        color: '#1f2937',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        textDecoration: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    Download
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    });

    // Cleanup only on component unmount, not on state changes
    useEffect(() => {
        return () => {
            urlsCreatedRef.current.forEach(url => {
                try { URL.revokeObjectURL(url); } catch (e) { }
            });
            urlsCreatedRef.current.clear();
        };
    }, []); // Empty deps = only run on unmount

    const totalFiles = Object.values(props.uploadedFiles).flat().length;

    return(
        <OverlayDrawer
            as="aside"
            size="large"
            position="end"
            open={props.open}
            onOpenChange={(_, { open }) => props.setOpen(open)}
        >
            <DrawerHeader className="!bg-gradient-to-br !from-[#EEF2FF] !to-[#FAF5FF]">
                <DrawerHeaderTitle
                    action={
                        <Button
                            appearance="subtle"
                            aria-label="Close"
                            icon={<Dismiss24Regular />}
                            onClick={() => props.setOpen(false)}
                        />
                    }
                >
                    Confirm uploaded documents
                </DrawerHeaderTitle>
            </DrawerHeader>
    
            <DrawerBody>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '24px' }}>
                    {Object.entries(props.uploadedFiles).map(([category, files]) => {
                        if (!files || files.length === 0) return null;
                        
                        return(
                            <div key={category} className="mt-1">
                                <div style={{ 
                                    borderBottom: '2px solid #d1d5db', 
                                    paddingBottom: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <h2 style={{ 
                                        fontSize: '18px', 
                                        fontWeight: '700', 
                                        color: '#111827', 
                                        margin: 0 
                                    }}>
                                        {category}
                                    </h2>
                                    <p style={{ 
                                        fontSize: '14px', 
                                        color: '#6b7280', 
                                        margin: '4px 0 0 0' 
                                    }}>
                                        {files.length} {files.length === 1 ? 'file' : 'files'}
                                    </p>
                                </div>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '8px',
                                    gridAutoRows: '1fr',
                                    maxHeight: '650px',
                                    overflow: 'auto',
                                    alignItems: 'stretch'
                                }}>
                                    {files.map((file, index) => {
                                        const src = GenerateUrl(file);
                                        const uniqueKey = file.id || `${category}-${index}-${Date.now()}`;

                                        return (
                                            <div key={uniqueKey} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                                <div style={{ flex: 1, overflow: 'auto' }}>
                                                    <FilePreview file={file} src={src} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {totalFiles === 0 && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: '64px 16px',
                            textAlign: 'center'
                        }}>
                            <div>
                                <svg 
                                    style={{ width: '80px', height: '80px', color: '#d1d5db', margin: '0 auto 16px' }}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={1.5} 
                                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                    />
                                </svg>
                                <p style={{ fontSize: '16px', color: '#9ca3af', fontWeight: '500' }}>
                                    No documents uploaded yet
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DrawerBody>

            <DialogActions className="!w-full flex">
                <div className="p-1 flex justify-end w-full">
                <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    alignItems: 'center', 
                    width: '100%', 
                    justifyContent: 'space-between', 
                    padding: '10px',
                    
                }}>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        {totalFiles} {totalFiles === 1 ? 'file' : 'files'} ready to submit
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button className="!rounded-2xl" onClick={() => props.setOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            appearance="primary" 
                            onClick={() => props.handleFormSubmit()}
                            disabled={totalFiles === 0}
                            className="!rounded-2xl"
                        >
                            Submit Form
                        </Button>
                    </div>
                </div>
                </div>
            </DialogActions>
        </OverlayDrawer>
    );
}

export default DocumentConfirmation;