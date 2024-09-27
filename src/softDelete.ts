import { Filter } from '@mikro-orm/core';

export function SoftDelete<
  Target extends { new (): { deletedAt: Date | null } },
>() {
  return function (target: Target) {
    Filter({
      name: 'deleted',
      cond: { deletedAt: { $eq: null } },
      default: true,
    })(target);
  };
}
