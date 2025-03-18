from transformers import pipeline
import re


def generate_template(disaster_type: str, disaster_context: str) -> str:

    prompt = f"""
    You are a professional news reporter whose job is to create a summary template for {disaster_type}. You should pick up on key attributes found across all the given paragraphs.

    Each context paragraph is a separate instance of a {disaster_type} event that has happened. 
    Your goal is to return ONE 5 sentence summary template that has key attributes left as tags in this format <example-attribute>. 
    The template should end with a tag specifically for unique/extra info about a specific {disaster_type}.

    Only use the provided summaries of crisis events

    For example, the template for a hurricane would look like this:

    <hurricane-name> made landfall as a <category> hurricane, impacting <primary-location> with <primary-impact>. 
    The storm caused <death-toll> deaths and resulted in <damage-cost> in damages. 
    <secondary-impact> displaced thousands and left widespread destruction. 
    The response and recovery efforts were <response-evaluation>. 
    <unique-extra-info>.

    RETURN ONLY THE TEMPLATE IN THE DESCRIBED FORMAT, NO OTHER TEXT.
    ONLY RETURN ONE TEMPLATE THAT COULD BE USED FOR THE DISASTER TYPE 
    MAKE SURE THE ATTRIBUTES/TEMPLATE ARE SPECIFIC TO THAT DISASTER TYPE AND ARE SURROUNDED BY THE <>.
    """

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": disaster_context},
    ]

    pipe = pipeline("text-generation", model="allenai/Llama-3.1-Tulu-3-8B")
    response = pipe(messages, max_length=2048)

    template = response[-1]["generated_text"][-1][ "content"]

    return template


def parse_attributes(template: str) -> list[str]:
    attributes = re.findall(r"<(.*?)>", template)

    return attributes


# example use
context = """
The deadliest and most destructive wildfire in California history, the Camp Fire erupted in Butte County and rapidly engulfed the town of Paradise. The fire was fueled by dry conditions and strong winds, spreading at an alarming rate. It destroyed nearly 19,000 structures, killed 85 people, and caused an estimated $16.5 billion in damages. The fire highlighted the growing threat of wildfires in California and led to major scrutiny of power company PG&E, whose equipment was found to have sparked the blaze.

One of the largest wildfires in California history, the Dixie Fire burned nearly a million acres across multiple counties. It destroyed the historic town of Greenville and forced thousands to evacuate. The fire, fueled by extreme drought and strong winds, lasted for months and caused over $637 million in damages. Investigations linked the fire to PG&E power lines, raising concerns about wildfire mitigation and infrastructure resilience.

One of Australia’s worst fire disasters, the Black Saturday Bushfires killed 173 people and destroyed over 2,000 homes across Victoria. The fires were fueled by record-breaking heat and strong winds, creating firestorms that moved rapidly through rural communities. The disaster prompted major reforms in Australia’s fire safety policies, including improved warning systems and stricter building codes in fire-prone areas.

At the time, the largest wildfire in California history, the Mendocino Complex Fire burned over 450,000 acres in Northern California. Consisting of two separate fires—the Ranch Fire and the River Fire—it destroyed hundreds of structures and caused widespread evacuations. The fire underscored the increasing frequency of massive wildfires in the state, largely driven by climate change and prolonged drought.

One of California’s largest and most destructive wildfires, the Thomas Fire burned over 280,000 acres in Ventura and Santa Barbara counties. Fueled by Santa Ana winds, it destroyed over 1,000 structures and led to mass evacuations. The fire also contributed to deadly mudslides in Montecito after heavy rains fell on the burned landscape. The disaster emphasized the long-term impacts of wildfires on erosion and flood risks.

The deadliest wildfire in U.S. history, the Peshtigo Fire devastated northeastern Wisconsin, killing an estimated 1,500 to 2,500 people. The firestorm, fueled by dry conditions and strong winds, spread rapidly, engulfing entire towns. Occurring on the same day as the Great Chicago Fire, the disaster received less national attention but remains one of the most significant fire tragedies in American history.

One of the largest wildfires in California history, the Cedar Fire burned over 273,000 acres in San Diego County. The fire was accidentally started by a lost hunter and rapidly spread due to Santa Ana winds. It destroyed over 2,800 structures and caused 15 deaths. The fire led to increased awareness of wildfire preparedness and the importance of defensible space around homes.

Sparked by a rare lightning storm, the LNU Lightning Complex Fire burned over 360,000 acres across multiple counties in Northern California. It destroyed over 1,500 structures and caused extensive damage to vineyards and rural communities. The fire was part of a record-breaking wildfire season in California, with climate change and extreme weather conditions contributing to the severity of the blazes.

A devastating wildfire in Northern California, the Carr Fire was ignited by sparks from a vehicle tire rim scraping the pavement. It burned over 229,000 acres and destroyed more than 1,600 structures. The fire generated a rare fire tornado, with winds reaching up to 143 mph. It resulted in eight deaths and over $1.6 billion in damages, highlighting the unpredictable and extreme nature of modern wildfires.

One of Canada’s most destructive wildfires, the Fort McMurray Fire forced the evacuation of nearly 90,000 people in Alberta. The fire burned over 1.5 million acres and destroyed thousands of homes and businesses. It caused an estimated $9 billion in damages, making it the costliest disaster in Canadian history. The fire underscored the growing wildfire risk in boreal forests due to climate change and prolonged dry conditions.
"""

template = generate_template(disaster_context=context, disaster_type="Wildfires")

attributes = parse_attributes(template=template)


print(template)
print(attributes)
