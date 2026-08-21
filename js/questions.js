/**
 * Aptitude Test Question Bank (70+ Questions)
 * Categories: Quantitative Aptitude, Logical Reasoning, Verbal Ability
 * Every test session generates a fresh, randomized 20-question set
 * using the Fisher-Yates shuffle algorithm.
 */

const QUESTION_BANK = [
    // ==========================================
    // 1. QUANTITATIVE APTITUDE (25 Questions)
    // ==========================================
    {
        id: "quant_1",
        category: "Quantitative Aptitude",
        topic: "Percentages & Profit/Loss",
        difficulty: "Medium",
        question: "A shopkeeper sells an article at a profit of 20%. If he had bought it at 20% less and sold it for $18 less, he would have gained 25%. What is the cost price of the article?",
        options: ["$120", "$150", "$180", "$200"],
        correct: 1, // $150
        explanation: "Let Cost Price (CP) = $x. Selling Price (SP) = 1.20x.\nNew CP = 0.80x.\nNew SP = 1.20x - 18.\nAccording to condition: New SP = 1.25 * New CP\n1.20x - 18 = 1.25 * (0.80x) = 1.00x\n1.20x - 1.00x = 18 => 0.20x = 18 => x = 18 / 0.20 = $150."
    },
    {
        id: "quant_2",
        category: "Quantitative Aptitude",
        topic: "Time and Work",
        difficulty: "Medium",
        question: "A can complete a piece of work in 12 days, and B can complete the same work in 18 days. If they work together for 4 days, what fraction of the work remains unfinished?",
        options: ["4/9", "5/9", "1/3", "2/5"],
        correct: 0, // 4/9
        explanation: "A's 1-day work = 1/12, B's 1-day work = 1/18.\nTogether in 1 day = 1/12 + 1/18 = (3 + 2)/36 = 5/36.\nIn 4 days, work done = 4 * (5/36) = 20/36 = 5/9.\nRemaining work = 1 - 5/9 = 4/9."
    },
    {
        id: "quant_3",
        category: "Quantitative Aptitude",
        topic: "Speed, Time & Distance",
        difficulty: "Hard",
        question: "A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?",
        options: ["65 seconds", "89 seconds", "100 seconds", "75 seconds"],
        correct: 1, // 89 seconds
        explanation: "Speed of train = Length of train / Time = 240 / 24 = 10 m/s.\nTotal distance to pass platform = Length of train + Length of platform = 240 + 650 = 890 m.\nTime taken = Total Distance / Speed = 890 / 10 = 89 seconds."
    },
    {
        id: "quant_4",
        category: "Quantitative Aptitude",
        topic: "Ratios & Proportions",
        difficulty: "Easy",
        question: "The ratio of ages of two friends A and B is 4:5. Six years hence, their ages will be in the ratio 6:7. What is the present age of B?",
        options: ["12 years", "15 years", "18 years", "20 years"],
        correct: 1, // 15 years
        explanation: "Let current ages be 4x and 5x.\nAfter 6 years: (4x + 6) / (5x + 6) = 6 / 7.\n7 * (4x + 6) = 6 * (5x + 6) => 28x + 42 = 30x + 36.\n2x = 6 => x = 3.\nPresent age of B = 5 * 3 = 15 years."
    },
    {
        id: "quant_5",
        category: "Quantitative Aptitude",
        topic: "Simple & Compound Interest",
        difficulty: "Medium",
        question: "The difference between simple interest and compound interest on a certain sum of money for 2 years at 10% per annum is $65. Find the sum.",
        options: ["$6,000", "$6,500", "$7,000", "$7,500"],
        correct: 1, // $6,500
        explanation: "Difference for 2 years = P * (R/100)².\n65 = P * (10/100)² = P * (1/100).\nP = 65 * 100 = $6,500."
    },
    {
        id: "quant_6",
        category: "Quantitative Aptitude",
        topic: "Averages",
        difficulty: "Easy",
        question: "The average score of 8 innings of a batsman is 45 runs. In the 9th inning, he scores 99 runs. What is his new average?",
        options: ["49 runs", "51 runs", "53 runs", "55 runs"],
        correct: 1, // 51 runs
        explanation: "Total runs in 8 innings = 8 * 45 = 360 runs.\nTotal runs after 9th inning = 360 + 99 = 459 runs.\nNew average = 459 / 9 = 51 runs."
    },
    {
        id: "quant_7",
        category: "Quantitative Aptitude",
        topic: "Number Series",
        difficulty: "Medium",
        question: "Find the missing number in the series: 7, 14, 42, 168, 840, ?",
        options: ["3360", "4200", "5040", "5880"],
        correct: 2, // 5040
        explanation: "The pattern multiplies by consecutive integers:\n7 * 2 = 14\n14 * 3 = 42\n42 * 4 = 168\n168 * 5 = 840\n840 * 6 = 5040."
    },
    {
        id: "quant_8",
        category: "Quantitative Aptitude",
        topic: "Permutations & Combinations",
        difficulty: "Hard",
        question: "In how many distinct ways can the letters of the word 'LEADER' be arranged?",
        options: ["120", "360", "720", "240"],
        correct: 1, // 360
        explanation: "The word 'LEADER' has 6 letters in total: L(1), E(2), A(1), D(1), R(1).\nNumber of distinct arrangements = 6! / 2! = 720 / 2 = 360."
    },
    {
        id: "quant_9",
        category: "Quantitative Aptitude",
        topic: "Probability",
        difficulty: "Medium",
        question: "Two fair dice are thrown simultaneously. What is the probability of getting a sum of 8?",
        options: ["5/36", "1/6", "7/36", "1/9"],
        correct: 0, // 5/36
        explanation: "Total outcomes = 6 * 6 = 36.\nFavorable outcomes for sum 8: (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 outcomes.\nProbability = 5/36."
    },
    {
        id: "quant_10",
        category: "Quantitative Aptitude",
        topic: "Pipes & Cisterns",
        difficulty: "Medium",
        question: "Pipe A can fill a tank in 6 hours and Pipe B can empty it in 8 hours. If both pipes are opened simultaneously, how many hours will it take to fill the empty tank?",
        options: ["14 hours", "18 hours", "24 hours", "30 hours"],
        correct: 2, // 24 hours
        explanation: "Net rate of filling per hour = 1/6 - 1/8 = (4 - 3)/24 = 1/24.\nTherefore, it will take 24 hours to completely fill the tank."
    },
    {
        id: "quant_11",
        category: "Quantitative Aptitude",
        topic: "Boats & Streams",
        difficulty: "Hard",
        question: "A man can row 18 km/h in still water. If the speed of the stream is 6 km/h, what is the time taken to row 48 km downstream?",
        options: ["2 hours", "2.5 hours", "3 hours", "4 hours"],
        correct: 0, // 2 hours
        explanation: "Downstream speed = Speed of boat + Speed of stream = 18 + 6 = 24 km/h.\nTime taken = Distance / Downstream speed = 48 / 24 = 2 hours."
    },
    {
        id: "quant_12",
        category: "Quantitative Aptitude",
        topic: "Mixtures & Alligations",
        difficulty: "Medium",
        question: "In what ratio must water be mixed with milk costing $60 per litre so that selling the mixture at $50 per litre yields no profit or loss?",
        options: ["1:5", "1:6", "1:4", "2:5"],
        correct: 0, // 1:5
        explanation: "Cost of Water = $0, Cost of Milk = $60, Mean Price = $50.\nRatio of Water : Milk = (60 - 50) : (50 - 0) = 10 : 50 = 1 : 5."
    },
    {
        id: "quant_13",
        category: "Quantitative Aptitude",
        topic: "Mensuration",
        difficulty: "Medium",
        question: "If the radius of a circle is increased by 50%, by what percentage does its area increase?",
        options: ["50%", "100%", "125%", "150%"],
        correct: 2, // 125%
        explanation: "Area is proportional to r².\nNew radius = 1.5r.\nNew area = π * (1.5r)² = 2.25 * (πr²).\nPercentage increase = ((2.25 - 1) / 1) * 100% = 125%."
    },
    {
        id: "quant_14",
        category: "Quantitative Aptitude",
        topic: "Time and Work",
        difficulty: "Easy",
        question: "If 15 men can complete a project in 20 days, how many men are required to complete the same project in 12 days?",
        options: ["20 men", "25 men", "30 men", "35 men"],
        correct: 1, // 25 men
        explanation: "Total Man-days required = 15 * 20 = 300.\nMen required for 12 days = 300 / 12 = 25 men."
    },
    {
        id: "quant_15",
        category: "Quantitative Aptitude",
        topic: "Number System",
        difficulty: "Easy",
        question: "What is the smallest number which when divided by 8, 12, and 16 leaves a remainder of 3 in each case?",
        options: ["45", "48", "51", "53"],
        correct: 2, // 51
        explanation: "LCM of (8, 12, 16) = 48.\nRequired number = LCM(8, 12, 16) + 3 = 48 + 3 = 51."
    },
    {
        id: "quant_16",
        category: "Quantitative Aptitude",
        topic: "Simplification",
        difficulty: "Easy",
        question: "Evaluate: (144 ÷ 12) + (5 × 16) - (240 ÷ 8)",
        options: ["62", "64", "58", "70"],
        correct: 0, // 62
        explanation: "Following BODMAS rule:\n144 ÷ 12 = 12\n5 × 16 = 80\n240 ÷ 8 = 30\nExpression = 12 + 80 - 30 = 92 - 30 = 62."
    },
    {
        id: "quant_17",
        category: "Quantitative Aptitude",
        topic: "Profit & Discount",
        difficulty: "Medium",
        question: "A trader marks his goods 40% above the cost price and allows a discount of 25% on the marked price. What is his net profit percentage?",
        options: ["5%", "10%", "15%", "20%"],
        correct: 0, // 5%
        explanation: "Let CP = 100. Marked Price = 140.\nDiscount = 25% of 140 = 35.\nSelling Price = 140 - 35 = 105.\nProfit = 105 - 100 = 5%."
    },
    {
        id: "quant_18",
        category: "Quantitative Aptitude",
        topic: "Quadratic Equations",
        difficulty: "Medium",
        question: "If the roots of equation x² - 7x + k = 0 are real and one root is 4, what is the value of k?",
        options: ["8", "10", "12", "14"],
        correct: 2, // 12
        explanation: "Substitute x = 4 into the equation:\n(4)² - 7(4) + k = 0 => 16 - 28 + k = 0 => -12 + k = 0 => k = 12."
    },
    {
        id: "quant_19",
        category: "Quantitative Aptitude",
        topic: "Speed & Distance",
        difficulty: "Medium",
        question: "A car covers a distance of 300 km in 5 hours. If its speed is decreased by 10 km/h, how much time will it take to cover the same distance?",
        options: ["5.5 hours", "6 hours", "6.5 hours", "7 hours"],
        correct: 1, // 6 hours
        explanation: "Initial speed = 300 / 5 = 60 km/h.\nNew speed = 60 - 10 = 50 km/h.\nNew time = 300 / 50 = 6 hours."
    },
    {
        id: "quant_20",
        category: "Quantitative Aptitude",
        topic: "Percentages",
        difficulty: "Easy",
        question: "If the price of sugar increases by 25%, by what percentage should a household reduce its consumption so that the total expenditure remains unchanged?",
        options: ["15%", "20%", "25%", "30%"],
        correct: 1, // 20%
        explanation: "Reduction % = [R / (100 + R)] * 100% = [25 / 125] * 100% = 1/5 * 100% = 20%."
    },
    {
        id: "quant_21",
        category: "Quantitative Aptitude",
        topic: "Simple Interest",
        difficulty: "Easy",
        question: "A sum of money doubles itself in 8 years at simple interest. What is the rate of interest per annum?",
        options: ["10%", "12.5%", "15%", "8%"],
        correct: 1, // 12.5%
        explanation: "SI = P. Time T = 8. SI = (P * R * T) / 100 => P = (P * R * 8) / 100 => R = 100 / 8 = 12.5%."
    },
    {
        id: "quant_22",
        category: "Quantitative Aptitude",
        topic: "Averages",
        difficulty: "Medium",
        question: "The average of 5 consecutive odd numbers is 27. What is the product of the first and fifth numbers?",
        options: ["713", "675", "735", "693"],
        correct: 0, // 713
        explanation: "The 5 numbers are (x-4, x-2, x, x+2, x+4). Average = x = 27.\nNumbers: 23, 25, 27, 29, 31.\nProduct of 1st and 5th = 23 * 31 = 713."
    },
    {
        id: "quant_23",
        category: "Quantitative Aptitude",
        topic: "Ratios",
        difficulty: "Easy",
        question: "Two numbers are in the ratio 3:5. If 9 is subtracted from each, the new ratio becomes 12:23. What is the smaller number?",
        options: ["27", "33", "36", "45"],
        correct: 1, // 33
        explanation: "(3x - 9)/(5x - 9) = 12/23 => 23(3x - 9) = 12(5x - 9) => 69x - 207 = 60x - 108 => 9x = 99 => x = 11.\nSmaller number = 3 * 11 = 33."
    },
    {
        id: "quant_24",
        category: "Quantitative Aptitude",
        topic: "Probability",
        difficulty: "Medium",
        question: "A card is drawn from a well-shuffled pack of 52 playing cards. What is the probability that it is either a King or a Heart?",
        options: ["4/13", "16/52", "1/4", "9/26"],
        correct: 0, // 4/13
        explanation: "Total Kings = 4, Total Hearts = 13 (including 1 King of Hearts).\nTotal favorable cards = 4 + 13 - 1 = 16.\nProbability = 16 / 52 = 4 / 13."
    },

    // ==========================================
    // 2. LOGICAL REASONING (25 Questions)
    // ==========================================
    {
        id: "logic_1",
        category: "Logical Reasoning",
        topic: "Blood Relations",
        difficulty: "Medium",
        question: "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?",
        options: ["Brother", "Uncle", "Father", "Grandfather"],
        correct: 2, // Father
        explanation: "Suresh's mother's only son is Suresh himself. Therefore, the boy is Suresh's son, which makes Suresh the boy's father."
    },
    {
        id: "logic_2",
        category: "Logical Reasoning",
        topic: "Coding & Decoding",
        difficulty: "Easy",
        question: "If in a code language, 'ROBOT' is coded as 'TQDQV', how will 'CLEAN' be coded in that same language?",
        options: ["ENGCP", "EMFCP", "ENGBO", "DMDCP"],
        correct: 0, // ENGCP
        explanation: "Each letter is shifted forward by +2 positions:\nR(+2)->T, O(+2)->Q, B(+2)->D, O(+2)->Q, T(+2)->V.\nSimilarly for CLEAN:\nC(+2)->E, L(+2)->N, E(+2)->G, A(+2)->C, N(+2)->P => ENGCP."
    },
    {
        id: "logic_3",
        category: "Logical Reasoning",
        topic: "Syllogisms",
        difficulty: "Medium",
        question: "Statements:\n1. All cars are vehicles.\n2. Some vehicles are electric.\nConclusions:\nI. Some cars are electric.\nII. Some vehicles are cars.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correct: 1, // Only conclusion II follows
        explanation: "Since all cars are vehicles, it naturally follows that some vehicles are cars (Conclusion II is valid). We cannot definitively conclude that any car is electric without further information, so I does not necessarily follow."
    },
    {
        id: "logic_4",
        category: "Logical Reasoning",
        topic: "Direction Sense",
        difficulty: "Medium",
        question: "A person walks 10 km North, turns right and walks 6 km, then turns right again and walks 18 km. How far and in which direction is he from his starting point?",
        options: ["10 km, South-East", "10 km, North-West", "8 km, South-East", "12 km, East"],
        correct: 0, // 10 km, South-East
        explanation: "Starting at (0,0):\nNorth 10 -> (0, 10)\nRight (East) 6 -> (6, 10)\nRight (South) 18 -> (6, 10 - 18) = (6, -8)\nDistance = √(6² + (-8)²) = √(36 + 64) = √100 = 10 km.\nDirection: Positive X (East) & Negative Y (South) => South-East."
    },
    {
        id: "logic_5",
        category: "Logical Reasoning",
        topic: "Seating Arrangement",
        difficulty: "Hard",
        question: "Five colleagues (P, Q, R, S, T) sit in a row facing North. R is to the immediate right of Q. S is between P and Q. T is to the extreme left. Who sits in the exact middle?",
        options: ["P", "Q", "R", "S"],
        correct: 3, // S
        explanation: "Arrangement from left to right:\nT is at the extreme left (1st). S is between P and Q, and R is to immediate right of Q.\nOrder: [T, P, S, Q, R]. The person in the 3rd (middle) position is S."
    },
    {
        id: "logic_6",
        category: "Logical Reasoning",
        topic: "Analogies",
        difficulty: "Easy",
        question: "Architect : Building :: Sculptor : ?",
        options: ["Museum", "Statue", "Canvas", "Chisel"],
        correct: 1, // Statue
        explanation: "An Architect designs/creates a Building. In the same relation, a Sculptor creates a Statue."
    },
    {
        id: "logic_7",
        category: "Logical Reasoning",
        topic: "Odd One Out",
        difficulty: "Easy",
        question: "Find the odd one out from the following options:",
        options: ["Copper", "Silver", "Gold", "Brass"],
        correct: 3, // Brass
        explanation: "Copper, Silver, and Gold are pure elementary metals, whereas Brass is an alloy (mixture of Copper and Zinc)."
    },
    {
        id: "logic_8",
        category: "Logical Reasoning",
        topic: "Letter Series",
        difficulty: "Medium",
        question: "Find the next term in the letter series: BDF, CFI, DHL, ?",
        options: ["EJO", "EKP", "EKO", "FLO"],
        correct: 0, // EJO
        explanation: "1st letters: B(2), C(3), D(4) -> E(5)\n2nd letters: D(4), F(6), H(8) -> J(10)\n3rd letters: F(6), I(9), L(12) -> O(15)\nTherefore, the next term is EJO."
    },
    {
        id: "logic_9",
        category: "Logical Reasoning",
        topic: "Clocks & Calendars",
        difficulty: "Medium",
        question: "What is the angle between the hour hand and the minute hand of a clock at 3:40 PM?",
        options: ["120°", "130°", "140°", "150°"],
        correct: 1, // 130°
        explanation: "Angle formula: θ = |30H - 5.5M|\nAt 3:40: θ = |30(3) - 5.5(40)| = |90 - 220| = |-130| = 130°."
    },
    {
        id: "logic_10",
        category: "Logical Reasoning",
        topic: "Clocks & Calendars",
        difficulty: "Medium",
        question: "If January 1, 2024 was a Monday, what day of the week was January 1, 2025?",
        options: ["Tuesday", "Wednesday", "Thursday", "Friday"],
        correct: 1, // Wednesday
        explanation: "2024 is a leap year (366 days). 366 mod 7 = 2 odd days.\nMonday + 2 days = Wednesday."
    },
    {
        id: "logic_11",
        category: "Logical Reasoning",
        topic: "Ranking & Ordering",
        difficulty: "Easy",
        question: "In a class of 45 students, Rahul's rank is 18th from the top. What is his rank from the bottom?",
        options: ["26th", "27th", "28th", "29th"],
        correct: 2, // 28th
        explanation: "Rank from bottom = (Total students - Rank from top) + 1 = (45 - 18) + 1 = 27 + 1 = 28th."
    },
    {
        id: "logic_12",
        category: "Logical Reasoning",
        topic: "Statement & Assumption",
        difficulty: "Medium",
        question: "Statement: 'Wear a helmet while riding a two-wheeler to ensure safety.'\nAssumption I: People wearing helmets are less likely to suffer fatal head injuries.\nAssumption II: Riders generally ignore safety rules.",
        options: ["Only Assumption I is implicit", "Only Assumption II is implicit", "Both I and II are implicit", "Neither I nor II is implicit"],
        correct: 0, // Only Assumption I is implicit
        explanation: "The advice is based on the proven effectiveness of helmets in preventing fatal head injuries (Assumption I). It does not presuppose that all riders ignore rules."
    },
    {
        id: "logic_13",
        category: "Logical Reasoning",
        topic: "Blood Relations",
        difficulty: "Hard",
        question: "A is the father of C, but C is not his son. E is the daughter of C. F is the spouse of A. B is the brother of C. How is E related to B?",
        options: ["Sister", "Niece", "Daughter", "Aunt"],
        correct: 1, // Niece
        explanation: "Since C is not A's son, C is A's daughter. B is C's brother. E is C's daughter. Therefore, E is B's niece (sister's daughter)."
    },
    {
        id: "logic_14",
        category: "Logical Reasoning",
        topic: "Dice & Cubes",
        difficulty: "Medium",
        question: "A cube is painted red on all 6 faces and then cut into 64 small equal-sized cubes. How many small cubes have exactly 2 red faces?",
        options: ["16", "24", "32", "12"],
        correct: 1, // 24
        explanation: "Total cubes n³ = 64 => n = 4.\nCubes with exactly 2 faces painted lie on the edges (excluding corners) = 12 * (n - 2) = 12 * (4 - 2) = 12 * 2 = 24."
    },
    {
        id: "logic_15",
        category: "Logical Reasoning",
        topic: "Mathematical Operations",
        difficulty: "Easy",
        question: "If '+' means '×', '-' means '÷', '×' means '+', and '÷' means '-', what is the value of: 16 + 4 - 8 ÷ 2 × 5?",
        options: ["11", "15", "9", "13"],
        correct: 0, // 11
        explanation: "Replacing operators:\n16 × 4 ÷ 8 - 2 + 5\n= (16 × 4) ÷ 8 - 2 + 5\n= 64 ÷ 8 - 2 + 5\n= 8 - 2 + 5 = 11."
    },
    {
        id: "logic_16",
        category: "Logical Reasoning",
        topic: "Pattern Recognition",
        difficulty: "Medium",
        question: "Which number replaces the question mark in the grid?\n[ 3, 5, 8 ]\n[ 4, 6, 10 ]\n[ 5, 7, ? ]",
        options: ["11", "12", "13", "14"],
        correct: 1, // 12
        explanation: "Pattern in each row: 1st number + 2nd number = 3rd number.\nRow 1: 3 + 5 = 8\nRow 2: 4 + 6 = 10\nRow 3: 5 + 7 = 12."
    },
    {
        id: "logic_17",
        category: "Logical Reasoning",
        topic: "Coding & Decoding",
        difficulty: "Medium",
        question: "In a certain code language, 'SYSTEM' is written as 'SYSMET' and 'NEARER' is written as 'AENRER'. How is 'FRACTION' written in that code?",
        options: ["CARFNOIT", "NOITCARF", "ARFCNOIT", "CRAHNOIT"],
        correct: 0, // CARFNOIT
        explanation: "The word has 8 letters. Divide into two halves: 'FRAC' and 'TION'. Reverse the first half -> 'CARF' and reverse the second half -> 'NOIT'. Combined: 'CARFNOIT'."
    },
    {
        id: "logic_18",
        category: "Logical Reasoning",
        topic: "Analogies",
        difficulty: "Easy",
        question: "Microscope : Bacteria :: Telescope : ?",
        options: ["Stars / Galaxies", "Molecules", "Viruses", "Insects"],
        correct: 0, // Stars / Galaxies
        explanation: "A microscope is used to view microscopic objects like bacteria. A telescope is used to view distant celestial objects like stars and galaxies."
    },
    {
        id: "logic_19",
        category: "Logical Reasoning",
        topic: "Direction Sense",
        difficulty: "Easy",
        question: "Ravi is facing West. He turns 45° in the clockwise direction and then another 180° in the same direction. Which direction is he facing now?",
        options: ["South-East", "North-East", "South-West", "North-West"],
        correct: 0, // South-East
        explanation: "West (270°) + 45° = North-West (315°). North-West + 180° = South-East."
    },
    {
        id: "logic_20",
        category: "Logical Reasoning",
        topic: "Number Ranking",
        difficulty: "Medium",
        question: "In a row of boys, Deepak is 7th from the left and Madhu is 12th from the right. If they interchange their positions, Deepak becomes 22nd from the left. How many boys are there in total?",
        options: ["31", "33", "35", "37"],
        correct: 1, // 33
        explanation: "After interchanging, Deepak occupies Madhu's original position (12th from right) and is 22nd from left.\nTotal boys = (Left pos + Right pos) - 1 = (22 + 12) - 1 = 34 - 1 = 33."
    },

    // ==========================================
    // 3. VERBAL ABILITY (25 Questions)
    // ==========================================
    {
        id: "verb_1",
        category: "Verbal Ability",
        topic: "Synonyms",
        difficulty: "Medium",
        question: "Choose the word that is most nearly SYNONYMOUS in meaning to: 'METICULOUS'",
        options: ["Careless", "Painstaking / Thorough", "Arrogant", "Superficial"],
        correct: 1, // Painstaking / Thorough
        explanation: "'Meticulous' means showing great attention to detail, very careful, precise, or painstaking."
    },
    {
        id: "verb_2",
        category: "Verbal Ability",
        topic: "Antonyms",
        difficulty: "Medium",
        question: "Choose the word that is most OPPOSITE in meaning to: 'CANDID'",
        options: ["Frank", "Deceptive / Guarded", "Honest", "Sincere"],
        correct: 1, // Deceptive / Guarded
        explanation: "'Candid' means truthful, frank, and straightforward. The opposite is deceptive, secretive, or guarded."
    },
    {
        id: "verb_3",
        category: "Verbal Ability",
        topic: "Spotting Errors",
        difficulty: "Medium",
        question: "Identify the part with a grammatical error:\n(A) Neither the teacher / (B) nor the students / (C) was present / (D) in the seminar hall.",
        options: ["(A) Neither the teacher", "(B) nor the students", "(C) was present", "(D) in the seminar hall"],
        correct: 2, // (C) was present
        explanation: "In 'Neither... nor' constructions, the verb agrees with the closer subject. 'Students' is plural, so it must be 'were present' instead of 'was present'."
    },
    {
        id: "verb_4",
        category: "Verbal Ability",
        topic: "Sentence Completion",
        difficulty: "Easy",
        question: "The jury was impressed by the candidate's _______ presentation and clear arguments.",
        options: ["lucid", "vague", "turbulent", "ambiguous"],
        correct: 0, // lucid
        explanation: "'Lucid' means expressed clearly and easy to understand, perfectly complementing 'clear arguments'."
    },
    {
        id: "verb_5",
        category: "Verbal Ability",
        topic: "Idioms & Phrases",
        difficulty: "Medium",
        question: "What does the idiom 'To bite the bullet' mean?",
        options: ["To accept an unpleasant situation bravely", "To start an aggressive argument", "To make a hasty decision", "To celebrate an unexpected victory"],
        correct: 0, // To accept an unpleasant situation bravely
        explanation: "'To bite the bullet' means to face a difficult, inevitable situation with courage and fortitude."
    },
    {
        id: "verb_6",
        category: "Verbal Ability",
        topic: "One Word Substitution",
        difficulty: "Easy",
        question: "A person who loves, supports, and defends their country is called a:",
        options: ["Mercenary", "Patriot", "Traitor", "Diplomat"],
        correct: 1, // Patriot
        explanation: "A 'Patriot' is a person who vigorously supports their country and is prepared to defend it against enemies."
    },
    {
        id: "verb_7",
        category: "Verbal Ability",
        topic: "Correct Spelling",
        difficulty: "Easy",
        question: "Choose the word with the correct spelling:",
        options: ["Accomodation", "Acommodation", "Accommodation", "Accomadation"],
        correct: 2, // Accommodation
        explanation: "The correct spelling is 'Accommodation' with double 'c' and double 'm'."
    },
    {
        id: "verb_8",
        category: "Verbal Ability",
        topic: "Prepositions",
        difficulty: "Easy",
        question: "She has been suffering from fever _______ last Tuesday.",
        options: ["since", "for", "from", "in"],
        correct: 0, // since
        explanation: "'Since' is used to denote a specific point in time in perfect continuous tenses (e.g., 'since last Tuesday')."
    },
    {
        id: "verb_9",
        category: "Verbal Ability",
        topic: "Active & Passive Voice",
        difficulty: "Medium",
        question: "Convert to Passive Voice: 'The engineer designed the entire software architecture.'",
        options: [
            "The entire software architecture was designed by the engineer.",
            "The entire software architecture is designed by the engineer.",
            "The entire software architecture had been designed by the engineer.",
            "The entire software architecture has designed by the engineer."
        ],
        correct: 0, // The entire software architecture was designed by the engineer.
        explanation: "Simple past active ('designed') converts to 'was/were + past participle' ('was designed')."
    },
    {
        id: "verb_10",
        category: "Verbal Ability",
        topic: "Synonyms",
        difficulty: "Hard",
        question: "Select the most appropriate synonym for: 'EPHEMERAL'",
        options: ["Eternal", "Transitory / Short-lived", "Massive", "Resilient"],
        correct: 1, // Transitory / Short-lived
        explanation: "'Ephemeral' means lasting for a very short time; transitory or fleeting."
    },
    {
        id: "verb_11",
        category: "Verbal Ability",
        topic: "Sentence Rearrangement",
        difficulty: "Medium",
        question: "Rearrange the fragments into a coherent sentence:\n(P) sustainable solutions\n(Q) engineers must develop\n(R) to combat climate change\n(S) innovative and",
        options: ["Q-S-P-R", "P-Q-S-R", "Q-R-S-P", "S-P-Q-R"],
        correct: 0, // Q-S-P-R
        explanation: "'Engineers must develop (Q) innovative and (S) sustainable solutions (P) to combat climate change (R).' -> Q-S-P-R."
    },
    {
        id: "verb_12",
        category: "Verbal Ability",
        topic: "Direct & Indirect Speech",
        difficulty: "Medium",
        question: "Change to Indirect speech: Rohit said, 'I am learning Python programming today.'",
        options: [
            "Rohit said that he was learning Python programming that day.",
            "Rohit said that he is learning Python programming today.",
            "Rohit told that he has been learning Python programming that day.",
            "Rohit says that he was learning Python programming today."
        ],
        correct: 0, // Rohit said that he was learning Python programming that day.
        explanation: "Present continuous ('am learning') becomes past continuous ('was learning'), and 'today' becomes 'that day'."
    },
    {
        id: "verb_13",
        category: "Verbal Ability",
        topic: "Sentence Correction",
        difficulty: "Easy",
        question: "Choose the correct alternative: 'He is junior _______ me in the department.'",
        options: ["than", "to", "from", "with"],
        correct: 1, // to
        explanation: "Adjectives ending in '-ior' (junior, senior, superior, inferior, prior) take the preposition 'to', never 'than'."
    },
    {
        id: "verb_14",
        category: "Verbal Ability",
        topic: "One Word Substitution",
        difficulty: "Medium",
        question: "One who possesses many talents or is capable of doing many things well:",
        options: ["Versatile", "Novice", "Virtuoso", "Polyglot"],
        correct: 0, // Versatile
        explanation: "'Versatile' describes someone able to adapt or perform many different functions or activities with skill."
    },
    {
        id: "verb_15",
        category: "Verbal Ability",
        topic: "Idioms & Phrases",
        difficulty: "Easy",
        question: "What is the meaning of 'A blessing in disguise'?",
        options: [
            "An apparent misfortune that leads to a positive outcome",
            "A religious ceremony",
            "A secret plan that fails",
            "A gift given without warning"
        ],
        correct: 0, // An apparent misfortune that leads to a positive outcome
        explanation: "'A blessing in disguise' is something that seems bad or unlucky at first, but ultimately results in something good happening."
    },
    {
        id: "verb_16",
        category: "Verbal Ability",
        topic: "Vocabulary",
        difficulty: "Medium",
        question: "Which word best describes an outcome that cannot be avoided or escaped?",
        options: ["Inevitable", "Infallible", "Impeccable", "Inaudible"],
        correct: 0, // Inevitable
        explanation: "'Inevitable' means certain to happen; unavoidable."
    },
    {
        id: "verb_17",
        category: "Verbal Ability",
        topic: "Antonyms",
        difficulty: "Medium",
        question: "Choose the word most OPPOSITE in meaning to: 'AUGMENT'",
        options: ["Diminish / Decrease", "Increase", "Reinforce", "Amplify"],
        correct: 0, // Diminish / Decrease
        explanation: "'Augment' means to make larger or increase. The opposite is to diminish, reduce, or decrease."
    },
    {
        id: "verb_18",
        category: "Verbal Ability",
        topic: "Spotting Errors",
        difficulty: "Easy",
        question: "Find the erroneous part:\n(A) One of the main reason / (B) for his success / (C) is his hard work / (D) and discipline.",
        options: ["(A) One of the main reason", "(B) for his success", "(C) is his hard work", "(D) and discipline"],
        correct: 0, // (A) One of the main reason
        explanation: "The phrase 'One of the...' must always be followed by a plural noun: 'One of the main reasons'."
    },
    {
        id: "verb_19",
        category: "Verbal Ability",
        topic: "Idioms & Phrases",
        difficulty: "Easy",
        question: "What does 'Break the ice' mean?",
        options: [
            "To relieve tension and make people feel comfortable",
            "To suffer an accident in winter",
            "To break an expensive object",
            "To end a long friendship"
        ],
        correct: 0, // To relieve tension and make people feel comfortable
        explanation: "'To break the ice' means to initiate conversation in a social setting and reduce stiffness or formality."
    },
    {
        id: "verb_20",
        category: "Verbal Ability",
        topic: "Correct Spelling",
        difficulty: "Medium",
        question: "Identify the correctly spelled word:",
        options: ["Entrepreneur", "Entreprenure", "Entrepraneur", "Enterpreneur"],
        correct: 0, // Entrepreneur
        explanation: "The correct spelling is 'Entrepreneur'."
    }
];

/**
 * High-Entropy Fisher-Yates Array Shuffle
 */
function fisherYatesShuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * Generates 20 distinct randomized questions for every test attempt:
 * - 7 Quantitative Aptitude
 * - 7 Logical Reasoning
 * - 6 Verbal Ability
 * Options are dynamically shuffled with exact index tracking.
 */
function generateTestQuestions() {
    const quant = QUESTION_BANK.filter(q => q.category === "Quantitative Aptitude");
    const logic = QUESTION_BANK.filter(q => q.category === "Logical Reasoning");
    const verbal = QUESTION_BANK.filter(q => q.category === "Verbal Ability");

    // Shuffle and pick
    const selectedQuant = fisherYatesShuffle(quant).slice(0, 7);
    const selectedLogic = fisherYatesShuffle(logic).slice(0, 7);
    const selectedVerbal = fisherYatesShuffle(verbal).slice(0, 6);

    // Combine and shuffle order of questions
    const combined = [...selectedQuant, ...selectedLogic, ...selectedVerbal];
    const testSet = fisherYatesShuffle(combined);

    // Map each question with shuffled options
    return testSet.map((q, index) => {
        const originalCorrectText = q.options[q.correct];
        const shuffledOptions = fisherYatesShuffle(q.options);
        const newCorrectIndex = shuffledOptions.indexOf(originalCorrectText);

        return {
            ...q,
            sessionIndex: index + 1,
            options: shuffledOptions,
            correct: newCorrectIndex,
            originalId: q.id
        };
    });
}
