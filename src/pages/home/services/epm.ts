import { EPMClient } from '../../../services/epm.client';
import { EPMActivities } from '../../../types/epm.types';
import { ErrorCode } from '../../../types/error-codes.types';
import { MRHMinutes } from '../../../types/meu-rh.types';
import { Project } from '../../../types/projects';
import { CookieUtils } from '../../../utils/cookieUtils';
import { FormatUtils } from '../../../utils/format.utils';

export class EPM {
  preloadCount: number | undefined;

  year: number = new Date().getFullYear();
  month: number = new Date().getMonth() + 1;

  private cache: Record<string, EPMActivities> = {};

  private _dailyMinutes: Record<string, { date: Date } & MRHMinutes> | undefined;
  public get dailyMinutes(): Record<string, MRHMinutes> | undefined {
    return this._dailyMinutes
      ? Object.fromEntries(Object.entries(this._dailyMinutes).map(([date, data]) => [date, data]))
      : undefined;
  }
  public set dailyMinutes(value: Record<string, MRHMinutes> | undefined) {
    this._dailyMinutes = value
      ? Object.fromEntries(
          Object.entries(value).map(([date, data]) => [
            FormatUtils.formatDate(new Date(date)),
            { date: new Date(date), ...data },
          ]),
        )
      : value;
  }

  activities: EPMActivities | undefined;

  constructor(private epmClient: EPMClient) {
    if (!CookieUtils.getCookie('epmToken')) this.epmClient.login();
  }

  getActivities = async (ignoreCache?: boolean): Promise<EPMActivities | ErrorCode> => {
    const requested = await this.getActivitiesInternal(this.year, this.month, ignoreCache);

    if (this.preloadCount) {
      for (let i = 1; i <= this.preloadCount; i++) {
        const year = this.month - i <= 0 ? this.year - 1 : this.year;
        const month = this.month - i <= 0 ? this.month - i + 12 : this.month - i;
        this.getActivitiesInternal(year, month);
      }
    }

    return requested;
  };

  private getActivitiesInternal = async (
    year: number,
    month: number,
    ignoreCache?: boolean,
  ): Promise<EPMActivities | ErrorCode> => {
    const cacheKey = `${year}-${month}`;
    if (!ignoreCache && cacheKey in this.cache) return this.cache[cacheKey];

    let activities = await this.epmClient.getActivities(year.toString(), month.toString());
    if ('code' in activities) {
      await this.epmClient.login();
      activities = await this.epmClient.getActivities(year.toString(), month.toString());
    }

    if ('code' in activities) return activities;

    this.cache[cacheKey] = activities;
    return activities;
  };

  createMissingDays = async (projects: Project[], selectedDates: Date[]) => {
    if (!this._dailyMinutes) throw new Error('Daily minutes not found!');
    if (!this.activities) throw new Error('Activities not found!');
    if (!selectedDates.length) return;

    const filteredDays = Object.entries(this._dailyMinutes).filter(([, { date }]) =>
      selectedDates.some(
        (selectedDate) =>
          selectedDate.getFullYear() === date.getFullYear() &&
          selectedDate.getMonth() === date.getMonth() &&
          selectedDate.getDate() === date.getDate(),
      ),
    );

    const daysInDailyMinutes = filteredDays.map(([date]) => date);
    const daysInActivities = Array.from(
      new Set(
        this.activities.projetos
          .map((projeto) => projeto.atividades.map((atividade) => atividade.diaMesAnoFormatado))
          .flat(),
      ),
    );

    const missingDays = daysInDailyMinutes.filter((day) => !daysInActivities.includes(day));

    const totalProjectsPercent = projects.reduce((acc, { proportion }) => acc + proportion, 0);
    const projectsAndMultipliers = projects.map(({ projectId, proportion, professionalId }) => ({
      projectId,
      multiplier: proportion / totalProjectsPercent,
      professionalId,
    }));

    for (const day of missingDays) {
      console.log(`Creating activities for ${day}`);
      const { date, minutes } = this._dailyMinutes[day];
      for (const { projectId, multiplier, professionalId } of projectsAndMultipliers) {
        const minutesForProject = Math.round(minutes * multiplier);
        try {
          console.log(`${date.toISOString()} - ${projectId} - ${minutesForProject} - ${professionalId}`);
          // await this.epmClient.createActivity(projectId, date, minutesForProject, professionalId);
        } catch (error) {
          console.error(`EPM create activity for date ${date} failed!`, error);
        }
      }
    }
  };
}

export default EPM;
