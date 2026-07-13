import type { IAttendanceRepository } from "@/domain/repositories";

export class AutoCloseAttendanceUseCase {
  constructor(private readonly repo: IAttendanceRepository) {}

  async execute(): Promise<{ closed: number }> {
    const closed = await this.repo.autoCloseShifts(new Date());
    return { closed };
  }
}
