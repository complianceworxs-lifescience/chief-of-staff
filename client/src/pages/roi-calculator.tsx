import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calculator, DollarSign, Clock, TrendingUp, CheckCircle, ArrowRight, Users, FileCheck, AlertTriangle, Activity } from "lucide-react";

const HIDE_NAV_STYLES = `
  nav, header, .navbar, .sidebar, aside, 
  [class*="nav"], [class*="header"], [class*="sidebar"],
  .bg-white.shadow-md, .bg-gray-50 > header,
  .md\\:hidden.bg-white, .max-w-7xl > header {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    overflow: hidden !important;
  }
  body, html, #root {
    padding-top: 0 !important;
    margin-top: 0 !important;
  }
  .min-h-screen.bg-gray-50 > main {
    padding-top: 0 !important;
  }
`;

interface ROIResult {
  currentCost: number;
  potentialSavings: number;
  roiValue: number;
  timeReclaimed: number;
  annualWasteCost: number;
  breakdown: {
    laborSavings: number;
    auditEfficiency: number;
    deviationReduction: number;
  };
  persona: string;
  personaLabel: string;
  recommendation: string;
}

interface CalculatorInputs {
  teamSize: number;
  hoursOnCompliance: number;
  hourlyRate: number;
  auditFrequency: number;
  auditPrepHours: number;
  deviationsPerYear: number;
  deviationCost: number;
  avgValidationHoursPerWeek: number;
  avgReleaseCyclesPerYear: number;
}

const DEFAULT_INPUTS: CalculatorInputs = {
  teamSize: 5,
  hoursOnCompliance: 15,
  hourlyRate: 75,
  auditFrequency: 2,
  auditPrepHours: 40,
  deviationsPerYear: 10,
  deviationCost: 5000,
  avgValidationHoursPerWeek: 20,
  avgReleaseCyclesPerYear: 4
};

export default function ROICalculator() {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<ROIResult | null>(null);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadForm, setLeadForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    role: ""
  });

  useEffect(() => {
    const styleId = 'roi-calculator-hide-nav';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = HIDE_NAV_STYLES;
      document.head.appendChild(style);
    }
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const calculateMutation = useMutation({
    mutationFn: async (inputs: CalculatorInputs) => {
      const response = await apiRequest("POST", "/api/revenue-acceleration/roi-calculator/calculate", inputs);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setResult(data.data);
        setShowLeadCapture(true);
      }
    },
    onError: () => {
      toast({
        title: "Calculation Error",
        description: "Unable to calculate ROI. Please try again.",
        variant: "destructive"
      });
    }
  });

  const captureLeadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/revenue-acceleration/roi-calculator/capture-lead", {
        ...leadForm,
        roiValue: result?.roiValue,
        persona: result?.persona,
        calculatorInputs: inputs
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Report Sent!",
          description: "Check your email for your personalized compliance ROI report."
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to send report. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCalculate = () => {
    calculateMutation.mutate(inputs);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm mb-4">
            <Calculator className="w-4 h-4" />
            Life Sciences Compliance ROI Calculator
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Transform Compliance from Overhead to
            <span className="text-blue-400"> Measurable Asset</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Calculate the economic impact of systematic compliance management on your organization.
            Get personalized insights in under 2 minutes.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Team Configuration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Tell us about your compliance team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Team Size (FTEs)</Label>
                    <span className="text-blue-400 font-semibold">{inputs.teamSize}</span>
                  </div>
                  <Slider
                    value={[inputs.teamSize]}
                    onValueChange={([value]) => setInputs({ ...inputs, teamSize: value })}
                    min={1}
                    max={50}
                    step={1}
                    className="py-2"
                    data-testid="slider-team-size"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Hours/Week on Compliance</Label>
                    <span className="text-blue-400 font-semibold">{inputs.hoursOnCompliance}h</span>
                  </div>
                  <Slider
                    value={[inputs.hoursOnCompliance]}
                    onValueChange={([value]) => setInputs({ ...inputs, hoursOnCompliance: value })}
                    min={5}
                    max={40}
                    step={1}
                    className="py-2"
                    data-testid="slider-hours-compliance"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Average Hourly Rate ($)</Label>
                  <Input
                    type="number"
                    value={inputs.hourlyRate}
                    onChange={(e) => setInputs({ ...inputs, hourlyRate: Number(e.target.value) })}
                    className="bg-slate-900/50 border-slate-600 text-white"
                    data-testid="input-hourly-rate"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-green-400" />
                  Audit Activity
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your inspection and audit landscape
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Audits per Year</Label>
                    <span className="text-green-400 font-semibold">{inputs.auditFrequency}</span>
                  </div>
                  <Slider
                    value={[inputs.auditFrequency]}
                    onValueChange={([value]) => setInputs({ ...inputs, auditFrequency: value })}
                    min={1}
                    max={12}
                    step={1}
                    className="py-2"
                    data-testid="slider-audit-frequency"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Hours Prep per Audit</Label>
                    <span className="text-green-400 font-semibold">{inputs.auditPrepHours}h</span>
                  </div>
                  <Slider
                    value={[inputs.auditPrepHours]}
                    onValueChange={([value]) => setInputs({ ...inputs, auditPrepHours: value })}
                    min={10}
                    max={200}
                    step={5}
                    className="py-2"
                    data-testid="slider-audit-prep"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Risk Exposure
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Deviations and their impact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Deviations per Year</Label>
                    <span className="text-amber-400 font-semibold">{inputs.deviationsPerYear}</span>
                  </div>
                  <Slider
                    value={[inputs.deviationsPerYear]}
                    onValueChange={([value]) => setInputs({ ...inputs, deviationsPerYear: value })}
                    min={1}
                    max={50}
                    step={1}
                    className="py-2"
                    data-testid="slider-deviations"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Average Cost per Deviation ($)</Label>
                  <Input
                    type="number"
                    value={inputs.deviationCost}
                    onChange={(e) => setInputs({ ...inputs, deviationCost: Number(e.target.value) })}
                    className="bg-slate-900/50 border-slate-600 text-white"
                    data-testid="input-deviation-cost"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-400" />
                  Validation Activity
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your validation workload and release cadence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Avg Validation Hours/Week</Label>
                    <span className="text-rose-400 font-semibold">{inputs.avgValidationHoursPerWeek}h</span>
                  </div>
                  <Slider
                    value={[inputs.avgValidationHoursPerWeek]}
                    onValueChange={([value]) => setInputs({ ...inputs, avgValidationHoursPerWeek: value })}
                    min={5}
                    max={60}
                    step={1}
                    className="py-2"
                    data-testid="slider-validation-hours"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Release Cycles per Year</Label>
                    <span className="text-rose-400 font-semibold">{inputs.avgReleaseCyclesPerYear}</span>
                  </div>
                  <Slider
                    value={[inputs.avgReleaseCyclesPerYear]}
                    onValueChange={([value]) => setInputs({ ...inputs, avgReleaseCyclesPerYear: value })}
                    min={1}
                    max={24}
                    step={1}
                    className="py-2"
                    data-testid="slider-release-cycles"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
              data-testid="button-calculate"
            >
              {calculateMutation.isPending ? (
                "Calculating..."
              ) : (
                <>
                  Calculate My ROI <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Your Compliance ROI Potential
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="text-6xl font-bold text-blue-400 mb-2" data-testid="text-roi-value">
                        {formatCurrency(result.roiValue)}
                      </div>
                      <p className="text-slate-400">Annual Savings Potential</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                        <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white" data-testid="text-current-cost">
                          {formatCurrency(result.currentCost)}
                        </div>
                        <p className="text-slate-400 text-sm">Current Cost</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                        <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white" data-testid="text-time-reclaimed">
                          {result.timeReclaimed.toLocaleString()}h
                        </div>
                        <p className="text-slate-400 text-sm">Hours Reclaimed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-900/40 to-rose-800/20 border-rose-600/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      Your Annual Operational Waste
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-5xl font-bold text-rose-400 mb-2" data-testid="text-annual-waste-cost">
                        {formatCurrency(result.annualWasteCost)}
                      </div>
                      <p className="text-slate-400 text-sm">
                        Based on {inputs.avgValidationHoursPerWeek} validation hours/week at $185/hour blended cost
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Savings Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-slate-300">Labor Efficiency</span>
                      </div>
                      <span className="text-blue-400 font-semibold">
                        {formatCurrency(result.breakdown.laborSavings)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(result.breakdown.laborSavings / result.roiValue) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-slate-300">Audit Prep Reduction</span>
                      </div>
                      <span className="text-green-400 font-semibold">
                        {formatCurrency(result.breakdown.auditEfficiency)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(result.breakdown.auditEfficiency / result.roiValue) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-slate-300">Deviation Prevention</span>
                      </div>
                      <span className="text-amber-400 font-semibold">
                        {formatCurrency(result.breakdown.deviationReduction)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${(result.breakdown.deviationReduction / result.roiValue) * 100}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-600/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-400" />
                      Your Profile: {result.personaLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-4" data-testid="text-recommendation">
                      {result.recommendation}
                    </p>

                    {showLeadCapture && (
                      <div className="bg-slate-900/50 rounded-lg p-4 space-y-4">
                        <p className="text-white font-medium">
                          Get your personalized ROI report + strategy guide:
                        </p>
                        <div className="grid gap-3">
                          <Input
                            placeholder="Work Email"
                            type="email"
                            value={leadForm.email}
                            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            data-testid="input-email"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              placeholder="First Name"
                              value={leadForm.firstName}
                              onChange={(e) => setLeadForm({ ...leadForm, firstName: e.target.value })}
                              className="bg-slate-800 border-slate-600 text-white"
                              data-testid="input-first-name"
                            />
                            <Input
                              placeholder="Last Name"
                              value={leadForm.lastName}
                              onChange={(e) => setLeadForm({ ...leadForm, lastName: e.target.value })}
                              className="bg-slate-800 border-slate-600 text-white"
                              data-testid="input-last-name"
                            />
                          </div>
                          <Input
                            placeholder="Company"
                            value={leadForm.company}
                            onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            data-testid="input-company"
                          />
                          <Input
                            placeholder="Role / Title"
                            value={leadForm.role}
                            onChange={(e) => setLeadForm({ ...leadForm, role: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            data-testid="input-role"
                          />
                        </div>
                        <Button
                          onClick={() => captureLeadMutation.mutate()}
                          disabled={!leadForm.email || captureLeadMutation.isPending}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          data-testid="button-get-report"
                        >
                          {captureLeadMutation.isPending ? "Sending..." : "Get My Free Report"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Calculator className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">
                    Configure Your Parameters
                  </h3>
                  <p className="text-slate-500 max-w-sm">
                    Adjust the sliders on the left to match your organization's compliance profile,
                    then click "Calculate My ROI" to see your potential savings.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            Based on industry benchmarks from Life Sciences compliance operations.
            <br />
            Individual results may vary. ComplianceWorxs helps organizations systematically
            achieve these efficiency gains.
          </p>
        </div>
      </div>
    </div>
  );
}
