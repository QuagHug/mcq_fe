import Breadcrumb from '../components/Breadcrumb';

const QuestionBank = () => {
    return (
        <div className="space-y-6">
            <Breadcrumb
                pageName="Question Bank"
                currentName="Question Bank"
            />

            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[70px] py-4 px-4 font-medium text-black dark:text-white">
                                    No.
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Question Bank ID
                                </th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                    Name
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Owner
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                    1
                                </td>
                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                    QB_2024_001
                                </td>
                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                    <a href="/question-bank/QB_2024_001" className="text-[#64748B] dark:text-[#64748B] hover:text-primary">
                                        Computer Network
                                    </a>
                                </td>
                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                    Quoc An
                                </td>
                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                    <div className="flex items-center space-x-3.5">
                                        <button className="hover:text-success">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                        <button className="hover:text-danger">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="py-5 px-4 dark:border-strokedark">
                                    2
                                </td>
                                <td className="py-5 px-4 dark:border-strokedark">
                                    QB_2024_002
                                </td>
                                <td className="py-5 px-4 dark:border-strokedark">
                                    <a href="/question-bank/QB_2024_002" className="text-[#64748B] dark:text-[#64748B] hover:text-primary">
                                        Database
                                    </a>
                                </td>
                                <td className="py-5 px-4 dark:border-strokedark">
                                    Quang Hung
                                </td>
                                <td className="py-5 px-4 dark:border-strokedark">
                                    <div className="flex items-center space-x-3.5">
                                        <button className="hover:text-success">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                        <button className="hover:text-danger">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-center">
                <div className="flex items-center gap-2">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke hover:border-primary hover:bg-primary hover:text-white dark:border-strokedark">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
                        </svg>
                    </button>

                    <button className="flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-primary bg-primary px-3 text-white">
                        1
                    </button>
                    <button className="flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-stroke hover:border-primary hover:bg-primary hover:text-white dark:border-strokedark px-3">
                        2
                    </button>
                    <button className="flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-stroke hover:border-primary hover:bg-primary hover:text-white dark:border-strokedark px-3">
                        3
                    </button>
                    <button className="flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-stroke hover:border-primary hover:bg-primary hover:text-white dark:border-strokedark px-3">
                        ...
                    </button>
                    <button className="flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-stroke hover:border-primary hover:bg-primary hover:text-white dark:border-strokedark px-3">
                        10
                    </button>

                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke hover:border-primary hover:bg-primary hover:text-white dark:border-strokedark">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionBank;
