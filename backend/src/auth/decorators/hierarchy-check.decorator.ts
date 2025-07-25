import { SetMetadata } from '@nestjs/common';
import { HierarchyCheckOptions } from '../guards/hierarchy.guard';

export const HIERARCHY_CHECK_KEY = 'hierarchyCheck';
export const HierarchyCheck = (options: HierarchyCheckOptions) =>
  SetMetadata(HIERARCHY_CHECK_KEY, options);
