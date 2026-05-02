const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all employees with salary info for payroll processing
const getPayrollData = async (req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { tenantId: req.user.tenantId, isActive: true },
      orderBy: { department: 'asc' }
    });

    // Calculate statutory deductions for each employee
    const payrollData = employees.map(emp => {
      const basic = emp.salary * 0.5;
      const hra = emp.salary * 0.2;
      const da = emp.salary * 0.15;
      const special = emp.salary - basic - hra - da;

      // PF: 12% of basic (employee + employer both 12%)
      const pfEmployee = Math.min(basic * 0.12, 1800); // Capped at ₹15000 basic
      const pfEmployer = pfEmployee;

      // ESIC: 0.75% employee, 3.25% employer (if salary <= ₹21000)
      const esicEmployee = emp.salary <= 21000 ? Math.round(emp.salary * 0.0075) : 0;
      const esicEmployer = emp.salary <= 21000 ? Math.round(emp.salary * 0.0325) : 0;

      // Professional Tax (Gujarat)
      let pt = 0;
      if (emp.salary > 12000) pt = 200;
      else if (emp.salary > 9000) pt = 150;

      // TDS (simplified - 5% above ₹25000/month)
      const tds = emp.salary > 25000 ? Math.round((emp.salary - 25000) * 0.05) : 0;

      const totalDeductions = pfEmployee + esicEmployee + pt + tds;
      const netSalary = emp.salary - totalDeductions;

      return {
        ...emp,
        components: { basic, hra, da, special },
        deductions: { pf: pfEmployee, esic: esicEmployee, pt, tds },
        employerContrib: { pf: pfEmployer, esic: esicEmployer },
        grossSalary: emp.salary,
        totalDeductions,
        netSalary
      };
    });

    const totalGross = payrollData.reduce((s, e) => s + e.grossSalary, 0);
    const totalNet = payrollData.reduce((s, e) => s + e.netSalary, 0);
    const totalDeductions = payrollData.reduce((s, e) => s + e.totalDeductions, 0);

    res.json({
      success: true,
      data: payrollData,
      summary: { totalEmployees: payrollData.length, totalGross, totalNet, totalDeductions }
    });
  } catch (e) { next({ status: 500, message: e.message }); }
};

// Generate payslip for single employee
const getPayslip = async (req, res, next) => {
  try {
    const emp = await prisma.employee.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const basic = emp.salary * 0.5;
    const hra = emp.salary * 0.2;
    const da = emp.salary * 0.15;
    const special = emp.salary - basic - hra - da;
    const pfEmployee = Math.min(basic * 0.12, 1800);
    const esicEmployee = emp.salary <= 21000 ? Math.round(emp.salary * 0.0075) : 0;
    const pt = emp.salary > 12000 ? 200 : emp.salary > 9000 ? 150 : 0;
    const tds = emp.salary > 25000 ? Math.round((emp.salary - 25000) * 0.05) : 0;
    const totalDeductions = pfEmployee + esicEmployee + pt + tds;

    res.json({
      success: true,
      data: {
        employee: emp,
        month: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
        earnings: [
          { label: 'Basic Salary', amount: basic },
          { label: 'HRA', amount: hra },
          { label: 'Dearness Allowance', amount: da },
          { label: 'Special Allowance', amount: special },
        ],
        deductions: [
          { label: 'Provident Fund (PF)', amount: pfEmployee },
          { label: 'ESIC', amount: esicEmployee },
          { label: 'Professional Tax', amount: pt },
          { label: 'TDS', amount: tds },
        ],
        grossSalary: emp.salary,
        totalDeductions,
        netSalary: emp.salary - totalDeductions
      }
    });
  } catch (e) { next({ status: 500, message: e.message }); }
};

module.exports = { getPayrollData, getPayslip };
