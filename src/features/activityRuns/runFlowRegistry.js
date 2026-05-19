import HeatFlow from './flows/HeatFlow'
import TimerFlow from './flows/TimerFlow'
import RelayFlow from './flows/RelayFlow'
import ScoringFlow from './flows/ScoringFlow'
import ParticipationFlow from './flows/ParticipationFlow'

export const runFlowRegistry = {
  HEAT: HeatFlow,
  TIMER: TimerFlow,
  RELAY: RelayFlow,
  SCORING: ScoringFlow,
  PARTICIPATION: ParticipationFlow,
}

export function getFlowComponent(uiMode) {
  return runFlowRegistry[uiMode] || TimerFlow
}

export default runFlowRegistry
