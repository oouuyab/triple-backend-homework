import { ActionType, EventType } from './types';

type ReadonlyRecord<K extends string, V> = Readonly<Record<K, V>>;

export const EventTypeLikeEnum: ReadonlyRecord<EventType, EventType> = {
  REVIEW: 'REVIEW',
};

export const ActionTypeLikeEnum: ReadonlyRecord<ActionType, ActionType> = {
  ADD: 'ADD',
  MOD: 'MOD',
  DELETE: 'DELETE',
};

export enum PointType {
  DEFAULT = 0,
  TEXT_POINT = 1,
  PHOTO_POINT = 2,
  PLACE_FIRST_POINT = 3,
}
