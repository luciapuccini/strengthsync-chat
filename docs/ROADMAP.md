# StrengthSync AI Planning

## What problems are we trying to solve?

- lots of health data collected through devices, no actionable output
- I have a gim routine very static, It should adapt to my needs every day. With data I want to know when I should push or when I should rest always keeping my targets prioritized
- fitness is not just the 1hr training in the gym, there is a lot arund the day that could push my progress forward
-

# MVP definition

1. given a baseline the user fit profile, there is a process that will run every X time to update the progress towards the user goal

```ts
    type Client {
    name: string,
    sex: "man" | "woman",
    age:number,
    weight: Weight,
    height: float,
    menstrual_cycle:MenstrualCycle,
    activity_level: Activities
    }

    type Weight {
    baseline: float
    current_weight_kg:float
    updated_at: Date
    }

    type Goals {
    target_weight_kg: flaot,
	target_body_fat_percent: number,
	body_fat_floor_percent:number,
	fat_to_lose_kg: float,
	muscle_to_gain_kg: float,
    updated_at:Date
    created_at:Date
    }

type BodyComposition {
        block_X: {
			weight_kg: float,
			body_fat_percent: number,
            muscle_percent:number
			bmr_kcal: number,
			tdee_kcal: number,
            created_at:Date,
            updated_at:Date,
		},
		baseline: {
			weight_kg: float,
            muscle_percent:number,
			body_fat_percent: number,
			bmr_kcal: number,
			tdee_kcal: number,
            created_at:Date,
		},
}

// current data only
type NutritionData {
    maiteinece_calories:number
    current_protocol: "deficit"|"mainatinence"|"bulking"
    cheat_meals_per_week:number
    supplements:Array<string>
    daily_targets: {
        kcal: number,
		protein_g: number,
		carbs_g: number,
		fat_g: number,
		fiber_g_minimum: number
		},
    created_at: Date
    updated_at:Date
 }

 type StrengthProgramStructure {
        current_block: number
        current_bocl_started_at: Date
		current_week: number
        weeks_per_block:number
		training_days_per_week: number
		rest_days_per_week:number
        weekly_shedule:WeeklyShedule
        daily_steps_target:number
        daily_move_target: ...
 }

type StrengthLoads{
    upper_body:Array<WeightExcersises>
	lower_body: Array<WeightExcersises>
    ...
    upper_body_day1 (if different series or reps in 2 days, but same excersise)
}

type WeightExcersises {
    name:string
    current_weight:float
    series:number
    reps:number
    created_at:Date
    updated_at:Date
}
```

# Workflows discovery

## Every week

1. user will mark week as complete -- trigger
2. action summary of progress file, check notes for actionable items etc .. AI
3. output to chat?
4. if() program /plan complete (no more weeks)
   4.1 new plan -- trigger other WF?
   4.2 generate this week's template from the plan

## Every end of plan

1. gather info on user progress, likes & dislikes:
   - programatic, maybe a quiz. json file for the weeks should reflect main issues
   - notes? chat weekly interactions?
2. given a fix set of "expert" rules + this context -> AI generate new plan
3. update the base template, the app state & copy assets
4. create a csv to export to trainer?
