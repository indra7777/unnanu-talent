const getTop5JobsForUser = async (userId) => {
    const jobs = [
        {
            id: 101,
            title: "Full Stack Java Developer with AWS and Angular",
            company: "Deltacubes",
            location: "Pune, Maharashtra, India",
            matchScore: 84,
            shortDescription: "4+ years of experience in full stack Java development. AWS & Angular expertise.",
            applyUrl: "https://example.com/job/101"
        },
        {
            id: 102,
            title: "Fullstack Java Developer",
            company: "IBM",
            location: "Kochi, Kerala, India",
            matchScore: 84,
            shortDescription: "Design, code, test, and provide industry-leading solutions at IBM.",
            applyUrl: "https://example.com/job/102"
        },
        {
            id: 103,
            title: "Java Fullstack Developer",
            company: "Cloud Counselage",
            location: "Coimbatore, Tamil Nadu, India",
            matchScore: 82,
            shortDescription: "Looking for a highly skilled and experienced Full Stack Developer…",
            applyUrl: "https://example.com/job/103"
        },
        {
            id: 104,
            title: "Backend Engineer (Java/Python)",
            company: "TechCorp",
            location: "Bangalore, Karnataka, India",
            matchScore: 80,
            shortDescription: "Join the core backend team working on distributed systems, microservices, and APIs.",
            applyUrl: "https://example.com/job/104"
        },
        {
            id: 105,
            title: "Senior Java Developer",
            company: "Globex Corporation",
            location: "Remote (India)",
            matchScore: 78,
            shortDescription: "Seeking experienced Java dev to build scalable software solutions in the cloud.",
            applyUrl: "https://example.com/job/105"
        }
    ];

    return jobs;
};

module.exports = getTop5JobsForUser;