import Breadcrumb from '../../components/Breadcrumb.tsx';
import HomePage from '../../images/cover/homepage.jpg';

const ECommerce = () => {
  return (
    <>
      <Breadcrumb pageName="Home Page" />
      <div className="relative w-full h-[500px]">
        {/* Background Image */}
        <img
          src={HomePage}
          alt="Home Page Cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Centered Content Block */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className="bg-black opacity-70 w-[95%] sm:w-[85%] md:w-[70%] lg:w-[60%] 
            h-auto min-h-[300px] md:h-[400px] rounded-lg flex flex-col items-center 
            justify-center p-4 sm:p-6"
          >
            {/* Heading */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-4 text-center">
              Welcome to HCMUT MCQ
            </h2>
            {/* Paragraph */}
            <p className="text-sm sm:text-base text-white text-center mb-4 sm:mb-6 px-2 sm:px-4">
              Join us to create multiple-choice tests to reinforce student
              knowledge and improve their scores.
            </p>
            {/* Buttons in a responsive grid/flex layout */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full px-4 sm:px-0 sm:justify-center">
              <button className="w-full sm:w-40 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base 
                text-white rounded-lg bg-[#1488DB] hover:bg-[#126fb5] transition-colors">
                View Question
              </button>
              <button className="w-full sm:w-40 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base 
                text-white rounded-lg bg-[#1488DB] hover:bg-[#126fb5] transition-colors">
                Make New Questions
              </button>
              <button className="w-full sm:w-40 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base 
                text-white rounded-lg bg-[#1488DB] hover:bg-[#126fb5] transition-colors">
                Construct Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ECommerce;
