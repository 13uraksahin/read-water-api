-- Add selectedTechnology and activeScenarioIds fields to Device model
-- for supporting multiple communication technologies and messaging scenarios

-- Add the selectedTechnology column (nullable, references CommunicationTechnology enum)
ALTER TABLE "devices" ADD COLUMN "selected_technology" "CommunicationTechnology";

-- Add the activeScenarioIds column (array of strings, defaults to empty array)
ALTER TABLE "devices" ADD COLUMN "active_scenario_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
