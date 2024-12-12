import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

            {/* Dialog */}
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative bg-white dark:bg-boxdark rounded-lg shadow-xl max-w-md w-full">
                    {/* Content */}
                    <div className="p-6">
                        <p className="text-lg text-black dark:text-white">{message}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-4 p-4 border-t border-stroke dark:border-strokedark">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            No
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-danger text-white rounded hover:bg-opacity-90 transition-all duration-200"
                        >
                            Yes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog; 