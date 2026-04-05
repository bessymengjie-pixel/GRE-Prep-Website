/* ─── GRE Prep — Writing Prompts ─────────────────────── */
var ISSUE_PROMPTS = [
  {
    id: "ip001",
    prompt: "As societies grow more technologically advanced, the need for humanistic education — the study of literature, philosophy, history, and the arts — diminishes.",
    taskDirections: "Write a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning for the position you take. In developing and supporting your position, you should consider ways in which the statement might or might not hold true and explain how these considerations shape your position.",
    directionType: "agree_disagree"
  },
  {
    id: "ip002",
    prompt: "Government funding should prioritize scientific research over the arts and humanities, since scientific advances lead to more tangible benefits for society.",
    taskDirections: "Write a response in which you discuss the extent to which you agree or disagree with the recommendation and explain your reasoning. In developing your position, describe specific circumstances in which adopting the recommendation would or would not be advantageous and explain how these circumstances shape your position.",
    directionType: "recommendation"
  },
  {
    id: "ip003",
    prompt: "The best way to teach is to praise positive actions and ignore negative ones.",
    taskDirections: "Write a response in which you discuss the extent to which you agree or disagree with the claim. In developing and supporting your position, address the most compelling reasons and/or examples that could be used to challenge your position.",
    directionType: "agree_disagree"
  },
  {
    id: "ip004",
    prompt: "Competition is ultimately more beneficial to society than cooperation, because it drives individuals and organizations to achieve their highest potential.",
    taskDirections: "Write a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning for the position you take. In developing and supporting your position, you should consider ways in which the statement might or might not hold true.",
    directionType: "agree_disagree"
  },
  {
    id: "ip005",
    prompt: "Nations should pass laws that limit the influence of any single media outlet, to ensure that citizens have access to a diversity of viewpoints.",
    taskDirections: "Write a response in which you discuss your views on the policy and explain your reasoning for the position you take. In developing and supporting your position, you should consider the possible consequences of implementing the policy and explain how these consequences shape your position.",
    directionType: "policy"
  },
  {
    id: "ip006",
    prompt: "Educational institutions have a responsibility to prioritize the development of moral character in students, not merely academic knowledge.",
    taskDirections: "Write a response in which you discuss the extent to which you agree or disagree with the claim and explain your reasoning. Address the most compelling reasons that could be used to challenge your position.",
    directionType: "agree_disagree"
  },
  {
    id: "ip007",
    prompt: "In most fields, the boundaries between disciplines are artificial constraints that limit intellectual progress. True innovation arises from collaboration across disciplines.",
    taskDirections: "Write a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning. Consider ways in which the statement might or might not hold true.",
    directionType: "agree_disagree"
  },
  {
    id: "ip008",
    prompt: "The rise of social media has been, on balance, detrimental to public discourse and democratic institutions.",
    taskDirections: "Write a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning. In developing your position, consider both the benefits and drawbacks of social media's influence on society.",
    directionType: "agree_disagree"
  },
  {
    id: "ip009",
    prompt: "Governments should place severe restrictions on immigration to protect the economic interests and cultural identity of their citizens.",
    taskDirections: "Write a response discussing the extent to which you agree or disagree, considering both the merits and limitations of the claim. Support your position with specific reasons and examples.",
    directionType: "agree_disagree"
  },
  {
    id: "ip010",
    prompt: "Success in any field requires more perseverance than talent; therefore, educational systems should focus on developing persistence rather than identifying and nurturing natural ability.",
    taskDirections: "Write a response in which you discuss the extent to which you agree or disagree with the recommendation. Describe specific circumstances in which adopting the recommendation would or would not be advantageous.",
    directionType: "recommendation"
  }
];

var ARGUMENT_PROMPTS = [
  {
    id: "ap001",
    prompt: "The following appeared in a memo from the director of Springdale Museum: 'Attendance at Springdale Museum has declined by 20% over the past five years. During this same period, the nearby Westfield Science Center opened its doors and has seen strong visitor numbers. To reverse this trend, the museum should convert two of its art galleries into interactive science exhibits, since surveys show that visitors prefer hands-on learning experiences. This change will undoubtedly restore visitor numbers to their previous level within one year.'",
    taskDirections: "Write a response in which you examine the stated and/or unstated assumptions of the argument. Be sure to explain how the argument depends on these assumptions and what the implications are if the assumptions prove unwarranted.",
    flaws: ["correlation vs causation", "unrepresentative survey", "hasty generalization", "false analogy"]
  },
  {
    id: "ap002",
    prompt: "The following is a letter to the city council: 'The city of Riverdale should adopt the same four-day workweek policy recently implemented by the city of Lakewood. Since Lakewood introduced this policy, employee satisfaction scores have risen by 15% and sick days taken have decreased. Clearly, a four-day workweek boosts productivity and morale. If Riverdale adopts this policy, we can expect similar improvements, and the city will become a more attractive employer, drawing top talent away from our competitors.'",
    taskDirections: "Write a response in which you discuss what questions would need to be answered in order to decide whether the recommendation and the argument on which it is based are reasonable. Be sure to explain how the answers to these questions would help to evaluate the recommendation.",
    flaws: ["false analogy", "insufficient evidence", "ignoring alternative explanations", "unwarranted assumption"]
  },
  {
    id: "ap003",
    prompt: "The following appeared in a report from the marketing department of Vitaboost Supplements: 'A recent study found that people who consumed Vitaboost's protein supplement three times per week for six months reported increased energy levels. Meanwhile, sales of energy drinks in our region have declined over the past year. This shows that consumers are shifting toward healthier alternatives, and that Vitaboost protein supplements are an effective substitute for energy drinks. We should therefore double our marketing budget for protein supplements and reduce spending on other product lines.'",
    taskDirections: "Write a response in which you examine the stated and/or unstated assumptions of the argument. Explain how the argument depends on these assumptions and what happens if they prove unwarranted.",
    flaws: ["biased sample", "correlation vs causation", "false dilemma", "sweeping generalization"]
  },
  {
    id: "ap004",
    prompt: "The following is an editorial in the Northgate Gazette: 'Crime in Northgate has fallen by 10% since the city installed surveillance cameras in public spaces two years ago. Clearly, the cameras are responsible for the drop in crime. The city should install cameras in the remaining neighborhoods to eliminate crime entirely. The minor concern about privacy is far outweighed by the safety benefits, which our residents clearly prefer, as shown by a recent poll in which 60% of respondents said they feel safer in camera-monitored areas.'",
    taskDirections: "Write a response in which you discuss what specific evidence is needed to evaluate the argument and explain how such evidence would weaken or strengthen the argument.",
    flaws: ["post hoc fallacy", "misleading statistics", "false dilemma", "unrepresentative sample"]
  },
  {
    id: "ap005",
    prompt: "The following appeared in a business proposal: 'Our competitor, TechEdge, recently moved its headquarters to the suburb of Greenville and subsequently reported a 25% increase in revenue over the following year. Employee retention also improved significantly. Clearly, the suburban setting provides a more productive working environment. Our company should therefore relocate from downtown to Greenville. The cost of the move will be recovered within two years through increased productivity and reduced employee turnover costs.'",
    taskDirections: "Write a response in which you examine the stated and/or unstated assumptions of the argument. Be sure to explain how the argument depends on these assumptions and what the implications are if the assumptions prove unwarranted.",
    flaws: ["post hoc fallacy", "false analogy", "oversimplification", "ignoring alternative factors"]
  }
];
