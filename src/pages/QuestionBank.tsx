import Breadcrumb from '../components/Breadcrumb';

const QuestionBank = () => {
    return (
        <div className="space-y-6">
            <Breadcrumb pageName="Question Bank" />

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Search by name"
                        className="w-full sm:w-64 rounded-lg border border-stroke bg-[#F8F9FA] px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                    />
                    <input
                        type="text"
                        placeholder="Search by owner"
                        className="w-full sm:w-64 rounded-lg border border-stroke bg-[#F8F9FA] px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                    />
                </div>

                <button className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-white hover:bg-opacity-90">
                    Add a new bank
                </button>
            </div>

            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
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
                            {/* Add table rows here */}
                        </tbody>
                    </table>
                </div>


                <div className="flex justify-center py-4">
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
        </div>
    );
};

export default QuestionBank;
