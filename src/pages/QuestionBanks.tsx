import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { fetchQuestionBanks, deleteQuestionBank, createQuestionBank } from '../services/api';
import React from 'react';

interface QuestionBank {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    children: QuestionBank[];
    question_count: number;
    last_modified: string;
}

const QuestionBanks = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const courseName = location.state?.courseName || "Computer Network";
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bankToDelete, setBankToDelete] = useState<{ id: number; name: string } | null>(null);

    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [expandedBanks, setExpandedBanks] = useState<number[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!courseId) return;
            try {
                const banksData = await fetchQuestionBanks(courseId);
                console.log('Raw banks data:', banksData);
                setQuestionBanks(banksData);
                setTotalPages(Math.ceil(banksData.length / 10));
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [courseId]);

    // Add debug log for rendering
    console.log('Current question banks state:', questionBanks);
    console.log('Parent banks:', questionBanks.filter(bank => bank.parent_id === null));
    console.log('Child banks:', questionBanks.filter(bank => bank.parent_id !== null));

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newBankName, setNewBankName] = useState('');

    // Helper function to get all possible parent banks in a flat structure with level indication
    const getFlattenedBanks = (banks: QuestionBank[], level: number = 0): { id: number; name: string; level: number }[] => {
        let flattened: { id: number; name: string; level: number }[] = [];
        banks.forEach(bank => {
            flattened.push({ id: bank.id, name: bank.name, level });
            if (bank.children?.length) {
                flattened = flattened.concat(getFlattenedBanks(bank.children, level + 1));
            }
        });
        return flattened;
    };

    const handleChapterClick = (chapterId: string, chapterName: string) => {
        navigate(`/courses/${courseId}/question-banks/${chapterId}`, {
            state: {
                courseName: courseName,
                chapterName: chapterName
            }
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleCreateBank = async () => {
        if (!newBankName.trim() || !courseId) {
            setError('Bank name is required');
            return;
        }

        try {
            setLoading(true);
            const newBank = await createQuestionBank(courseId, { 
                name: newBankName.trim(),
                parent_id: selectedParentId ? parseInt(selectedParentId) : null 
            });

            // Update the question banks state to include the new bank
            setQuestionBanks(prev => {
                if (!selectedParentId) {
                    // Add to top level if no parent selected
                    return [...prev, newBank];
                }
                
                // Helper function to recursively update the banks
                const updateBanks = (banks: QuestionBank[]): QuestionBank[] => {
                    return banks.map(bank => {
                        if (bank.id.toString() === selectedParentId) {
                            return {
                                ...bank,
                                children: [...(bank.children || []), newBank]
                            };
                        }
                        if (bank.children?.length) {
                            return {
                                ...bank,
                                children: updateBanks(bank.children)
                            };
                        }
                        return bank;
                    });
                };

                return updateBanks(prev);
            });

            setNewBankName('');
            setSelectedParentId(null);
            setIsDialogOpen(false);
        } catch (err) {
            setError('Failed to create question bank');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: number, name: string) => {
        setBankToDelete({ id, name });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!bankToDelete || !courseId) return;

        try {
            await deleteQuestionBank(courseId, bankToDelete.id.toString());
            setQuestionBanks(questionBanks.filter(bank => bank.id !== bankToDelete.id));
            setShowDeleteModal(false);
            setBankToDelete(null);
        } catch (err) {
            setError('Failed to delete question bank');
        }
    };

    const toggleExpand = (bankId: number) => {
        setExpandedBanks(prev => 
            prev.includes(bankId) 
                ? prev.filter(id => id !== bankId)
                : [...prev, bankId]
        );
    };

    // Modify the rendering of banks to handle recursive nesting
    const renderBankRow = (bank: QuestionBank, index: number, level: number = 0) => {
        return (
            <React.Fragment key={bank.id}>
                <tr className={level > 0 ? 'bg-gray-50 dark:bg-meta-4/30' : ''}>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        {level === 0 ? index + 1 : ''}
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
                            {bank.children?.length > 0 ? (
                                <button
                                    onClick={() => toggleExpand(bank.id)}
                                    className="mr-2 p-1 hover:bg-gray-100 rounded-full dark:hover:bg-meta-4"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-4 w-4 transition-transform ${
                                            expandedBanks.includes(bank.id) ? 'rotate-90' : ''
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            ) : (
                                <div className="w-8"></div>
                            )}
                            <Link
                                to={`/courses/${courseId}/question-banks/${bank.id}`}
                                state={{
                                    courseName: courseName,
                                    chapterName: bank.name
                                }}
                                className="text-black dark:text-white hover:text-primary"
                            >
                                {bank.name}
                            </Link>
                        </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="inline-flex items-center justify-center rounded-full bg-meta-3 bg-opacity-10 py-1 px-3 text-sm font-medium text-meta-3">
                            {bank.question_count} Questions
                        </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        {new Date(bank.last_modified).toLocaleDateString()}
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center space-x-3.5">
                            <button className="hover:text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                            </button>
                            <button
                                className="hover:text-danger"
                                onClick={() => handleDeleteClick(bank.id, bank.name)}
                            >
                                <svg
                                    className="fill-current"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z" />
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
                {expandedBanks.includes(bank.id) && bank.children?.map((childBank, childIndex) => 
                    renderBankRow(childBank, childIndex, level + 1)
                )}
            </React.Fragment>
        );
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-8">
                    <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                        {courseName}
                    </h2>

                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                    >
                        Create Bank
                    </button>
                </div>

                <nav>
                    <ol className="flex items-center gap-2">
                        <li>
                            <Link to="/" className="text-[#64748B] hover:text-primary">
                                Home Page
                            </Link>
                        </li>
                        <span className="text-[#64748B]">/</span>
                        <li>
                            <Link to="/courses" className="text-[#64748B] hover:text-primary">
                                Courses
                            </Link>
                        </li>
                        <span className="text-[#64748B]">/</span>
                        <li className="text-primary">
                            {courseName}
                        </li>
                    </ol>
                </nav>
            </div>

            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[70px] py-4 px-4 font-medium text-black dark:text-white">
                                    No.
                                </th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                    Question Bank
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Questions
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Last Modified
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {questionBanks
                                .filter(bank => !bank.parent_id) // Only render top-level banks
                                .map((bank, index) => renderBankRow(bank, index))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Component */}
            <div className="flex justify-center items-center space-x-2 mt-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="hover:text-primary"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
                {[...Array(totalPages)].map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-2 py-1 ${currentPage === index + 1 ? 'text-primary' : 'hover:text-primary'}`}
                    >
                        {index + 1}
                    </button>
                ))}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="hover:text-primary"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
                    </svg>
                </button>
            </div>

            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-boxdark rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
                            Create New Question Bank
                        </h3>
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Bank Name
                            </label>
                            <input
                                type="text"
                                value={newBankName}
                                onChange={(e) => setNewBankName(e.target.value)}
                                placeholder="Enter question bank name"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                autoFocus
                            />
                        </div>

                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Parent Bank (Optional)
                            </label>
                            <select
                                value={selectedParentId || ''}
                                onChange={(e) => setSelectedParentId(e.target.value || null)}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            >
                                <option value="">None (Top Level)</option>
                                {getFlattenedBanks(questionBanks).map(bank => (
                                    <option key={bank.id} value={bank.id}>
                                        {'\u00A0'.repeat(bank.level * 4)}{bank.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setNewBankName('');
                                    setSelectedParentId(null);
                                }}
                                className="rounded border border-stroke py-2 px-6 text-base font-medium text-black hover:border-primary hover:bg-primary/5 dark:border-strokedark dark:text-white dark:hover:border-primary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateBank}
                                disabled={!newBankName.trim()}
                                className={`rounded py-2 px-6 text-base font-medium text-white transition
                                    ${!newBankName.trim() 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-primary hover:bg-opacity-90'}`}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-999999 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                            Delete Question Bank
                        </h3>
                        <p className="mb-6 text-base text-body-color dark:text-body-color-dark">
                            Are you sure you want to delete "{bankToDelete?.name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setBankToDelete(null);
                                }}
                                className="rounded border border-stroke py-2 px-6 text-base font-medium text-black hover:border-primary hover:bg-primary/5 dark:border-strokedark dark:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="rounded bg-danger py-2 px-6 text-base font-medium text-white hover:bg-opacity-90"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionBanks;