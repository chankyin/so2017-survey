const readLine = require("readline")
const fs = require("fs")
const csv = require("csv-parser")

const inputs = []

function createConverters() {
	const converters = {}

	function addSwitch(name, opts, def) {
		return r => {
			if(opts[r[name]] !== undefined) return opts[r[name]]
			if(def !== undefined) return def
			throw `Unknown option ${def}`
		}
	}
	addSwitch("CompanySize", {
		"Fewer than 10 employees": 0.5,
		"10 to 19 employees": 1,
		"20 to 99 employees": 1.5,
		"100 to 499 employees": 2,
		"500 to 999 employees": 2.5,
		"1,000 to 4,999 employees": 3,
		"5,000 to 9,999 employees": 3.5,
		"10,000 or more employees": 4,
	}, 0)
	addSwitch("LastNewJob", {
		"Less than a year ago": 0,
		"Between 1 and 2 years ago": 1,
		"Between 2 and 4 years ago": 2,
		"More than 4 years ago": 3,
	}, 4)
	addSwitch("Overpaid", {
		"Greatly underpaid": -2,
		"Somewhat underpaid": -1,
		"Neither underpaid nor overpaid": 0,
		"Somewhat overpaid": 1,
		"Greatly overpaid": 2,
		"NA": 0,
	})
	addSwitch("EducationImportant", {
		"Not at all important": -2,
		"Not very important": -1,
		"Somewhat important": 0,
		"Important": 1,
		"Very important": 2,
		"NA": 0,
	})
	addSwitch("CheckInCode", {
		"Multiple times a day": 1,
		"Once a day": 2,
		"A few times a week": 3,
		"A few times a month": 4,
		"Just a few times over the year": 5,
		"Never": 6,
	})
	addSwitch("StackOverflowDescribes", {
		"I'd never heard of Stack Overflow before today": 1,
		"I've heard of Stack Overflow, but have never visited": 2,
		"I've visited Stack Overflow, but haven't logged in/created an account": 3,
		"I have a login for Stack Overflow, but haven't created a CV or Developer Story": 4,
		"I have created a CV or Developer Story on Stack Overflow": 5,
	})
	addSwitch("HighestEducationParents", {
		"No education": 0,
		"Primary/elementary school": 1,
		"High school": 2,
		"Some college/university study, no bachelor's degree": 3,
		"A professional degree": 4,
		"A bachelor's degree": 5,
		"A master's degree": 6,
		"A doctoral degree": 7,
	}, 0)
	for(const threeMonths of [
		"StackOverflowFoundAnswer",
		"StackOverflowCopiedCode",
		"StackOverflowJobListing",
		"StackOverflowCompanyPage",
		"StackOverflowJobSearch",
		"StackOverflowNewQuestion",
		"StackOverflowAnswer",
		"StackOverflowMetaChat",
	]) addSwitch(threeMonths, {
		"At least once each day": 1,
		"At least once each week": 2,
		"Several times": 3,
		"Once or twice": 4,
		"Haven't done at all": 5,
	})

	for(const years of [
		"YearsProgram",
		"YearsCodedJob",
		"YearsCodedJobPast",
	]) {
		converters[years] = r => {
			if(r[years] === "Less than a year" || r[years] === "NA") return 0
			const ret = parseInt(r[years].split(" ")[0])
			if(isNaN(ret)) throw `Unexpected number ${r[years]}`
			return ret
		}
	}
	for(const f of [
		"CareerSatisfaction",
		"JobSatisfaction",
		"HoursPerWeek",
		"StackOverflowSatisfaction",
		"Salary",
		"ExpectedSalary",
	]) converters[f] = r => r[f] === "NA" ? 0 : parseFloat(r[f])

	for(const bool of [
		"ClickyKeys",
	]) converters[bool] = r => r[bool] === "Yes" ? "1" : "0"

	for(const agree of [
		"ProblemSolving",
		"BuildingThings",
		"LearningNewTech",
		"JobSecurity",
		"DiversityImportant",
		"AnnoyingUI",
		"FriendsDevelopers",
		"RightWrongWay",
		"UnderstandComputers",
		"SeriousWork",
		"InvestTimeTools",
		"WorkPayCare",
		"KinshipDevelopers",
		"ChallengeMyself",
		"CompetePeers",
		"ChangeWorld",
		"ShipIt",
		"OtherPeoplesCode",
		"ProjectManagement",
		"EnjoyDebugging",
		"InTheZone",
		"DifficultCommunication",
		"CollaborateRemote",
		"StackOverflowAdsRelevant",
		"StackOverflowAdsDistracting",
		"StackOverflowModeration",
		"StackOverflowCommunity",
		"StackOverflowHelpful",
		"StackOverflowBetter",
		"StackOverflowWhatDo",
		"StackOverflowMakeMoney",
		"SurveyLong",
		"QuestionsInteresting",
		"QuestionsConfusing",
		"InterestedAnswers",
	]) converters[agree] = r => {
		switch(r[agree]) {
			case "Strongly disagree": return -2
			case "Disagree": return -1
			case "Somewhat agree": return 0
			case "Agree": return 1
			case "Strongly agree": return 2
			case "NA": return 0
		}
	}

	for(const factor of [
		"TabsSpaces",
		"Professional",
		"ProgramHobby",
		"Country",
		"University",
		"EmploymentStatus",
		"FormalEducation",
		"MajorUndergrad",
		"HomeRemote",
		"CompanyType",
		"DeveloperType",
		"WebDeveloperType",
		"MobileDeveloperType",
		"NonDeveloperType",
		"PronounceGIF",
		"JobSeekingStatus",
		"ImportantBenefits",
		"JobProfile",
		"ResumePrompted",
		"LearnedHiring",
		"EducationTypes",
		"SelfTaughtTypes",
		"WorkStart", // TODO fix
		"HaveWorkedLanguage",
		"WantWorkLanguage",
		"HaveWorkedFramework",
		"WantWorkFramework",
		"HaveWorkedDatabase",
		"WantWorkDatabase",
		"HaveWorkedPlatform",
		"WantWorkPlatform",
		"IDE",
		"AuditoryEnvironment",
		"Methodology",
		"VersionControl",
		"MetricAssess",
		"StackOverflowDevices",
		"Gender",
		"Race",
	]) {
		const uniq = {}
		console.log(`Counting factor ${factor}`)
		for(const row of inputs) {
			for(const value of row[factor].split("; ")) {
				uniq[value] = true
			}
		}
		for(const value in uniq) {
			converters[factor + "_" + value] = r => r[factor].split("; ").includes(value) ? "1" : "0"
		}
	}

	return converters
}

let i = 0

fs.createReadStream("survey_results_public.csv")
	.pipe(csv())
	.on("data", row => {
		if((++i) % 100 === 0) console.log(`Read ${i} lines`)
		inputs.push(row)
	})
	.on("end", () => {
		const converters = createConverters()
		const outWs = fs.openSync("results_clean.csv", "w")

		let i = 0
		;(async () => {
			let first = true
			for(let field in converters) {
				if(!first) fs.writeSync(outWs, ",")
				first = false
				if(field.includes(",")) {
					console.warn(`${field} includes comma, renaming`)
					field = field.replace(/,/g, ".")
				}
				fs.writeSync(outWs, field)
			}
			fs.writeSync(outWs, "\n")
			for(const input of inputs) {
				let first = true
				for(const field in converters) {
					if(!first) fs.writeSync(outWs, ",")
					first = false
					// console.log(`Transforming ${field}`)
					const transformed = converters[field](input)
					if(transformed === undefined) throw `Transform to ${field} given ${JSON.stringify(input)} got undefined`
					if(isNaN(transformed)) throw `Transform to ${field} given ${JSON.stringify(input)} got NaN`
					fs.writeSync(outWs, transformed.toString())
				}
				fs.writeSync(outWs, "\n")

				if((++i) % 100 === 0) {
					console.log(`Written ${i} lines`)
					// await wait(1) // give nodejs a chance to cleanup
				}
			}
		})().catch(console.error)
	})

function wait(ms) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, ms)
	})
}
