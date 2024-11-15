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
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="bg-black opacity-70 w-[80%] md:w-[60%] h-[400px] rounded-lg flex flex-col items-center justify-center p-6"
          >
            {/* Heading */}
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to MCQBK
            </h2>
            {/* Paragraph */}
            <p className="text-white text-center mb-6">
              Join us to create multiple-choice tests to reinforce student
              knowledge and improve their scores.
            </p>
            {/* Buttons in a horizontal row */}
            <div className="flex gap-4">
              <button className="w-40 px-6 py-3 text-white rounded-lg bg-[#1488DB] hover:bg-[#126fb5]">
                View Question
              </button>
              <button className="w-40 px-6 py-3 text-white rounded-lg bg-[#1488DB] hover:bg-[#126fb5]">
                Make New Questions
              </button>
              <button className="w-40 px-6 py-3 text-white rounded-lg bg-[#1488DB] hover:bg-[#126fb5]">
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
