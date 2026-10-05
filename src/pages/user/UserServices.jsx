import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Building2, Clock, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { organizationService } from '../../services/organizationService';
import { serviceService } from '../../services/serviceService';

const UserServices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sector, setSector] = useState('All');
  
  const [organizations, setOrganizations] = useState([]);
  const [allServices, setAllServices] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgDetails, setOrgDetails] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [orgsData, servicesData] = await Promise.all([
          organizationService.getAllOrganizations(),
          serviceService.getAllServices()
        ]);
        setOrganizations(orgsData);
        setAllServices(servicesData);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Your session has expired. Please login again.");
        } else if (err.response?.status === 403) {
          setError("You don't have permission to perform this action.");
        } else {
          setError("Unable to connect to SmartQueue server.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectOrg = async (org) => {
    setSelectedOrg(org);
    try {
      setOrgLoading(true);
      const details = await organizationService.getOrganizationById(org.id);
      setOrgDetails(details);
    } catch (err) {
      console.error(err);
    } finally {
      setOrgLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedOrg(null);
    setOrgDetails(null);
  };

  // Normalization logic
  const sectors = ['All', 'HEALTHCARE', 'BANK', 'GOVERNMENT', 'SALON', 'SERVICE_CENTER', 'CLINIC'];

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sector === 'All' || org.sector === sector;
    return matchesSearch && matchesSector;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Loading Organizations...</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 h-48 animate-pulse bg-slate-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 btn-primary">Retry</button>
      </div>
    );
  }

  // --- ORG DETAILS VIEW ---
  if (selectedOrg) {
    const orgServices = allServices.filter(s => s.organization_id === selectedOrg.id);
    
    return (
      <div className="space-y-6">
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Organizations
        </button>

        {orgLoading ? (
           <div className="card p-6 h-32 animate-pulse bg-slate-100"></div>
        ) : (
          <div className="card p-8 bg-white border-primary-100 border-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-3">
                  {orgDetails?.sector || selectedOrg.sector}
                </div>
                <h2 className="text-3xl font-bold text-slate-900">{orgDetails?.name || selectedOrg.name}</h2>
                <p className="text-slate-500 mt-2">{orgDetails?.description || selectedOrg.description || "No description provided."}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {orgDetails?.address || selectedOrg.address}</span>
                  <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {orgDetails?.phone || selectedOrg.phone}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Available Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orgServices.length > 0 ? orgServices.map(service => (
            <div key={service.id} className="card p-6 hover:shadow-md transition-shadow flex flex-col justify-between border border-slate-100">
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{service.name}</h4>
                <p className="text-sm text-slate-500 mb-4">{service.description}</p>
                <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded-md mb-4">
                  <Clock className="w-4 h-4 mr-2 text-primary-500" />
                  Avg. Time: {service.average_service_time} mins
                </div>
              </div>
              <Link to="/user/book" className="btn-primary w-full text-center">
                Book Appointment
              </Link>
            </div>
          )) : (
            <p className="text-slate-500">No active services available for this organization.</p>
          )}
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Find Organizations</h2>
          <p className="text-slate-500 text-sm">Select an organization to view and book services</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-slate-400" />
            </div>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="input-field pl-10 bg-white"
            >
              {sectors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Orgs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrgs.map(org => (
          <div key={org.id} onClick={() => handleSelectOrg(org)} className="card p-6 hover:shadow-lg hover:border-primary-200 border-2 border-transparent transition-all cursor-pointer group flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="inline-flex px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                {org.sector || "General"}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">{org.name}</h3>
            <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
              {org.description || "No description provided."}
            </p>
            
            <div className="space-y-2 mt-auto pt-4 border-t border-slate-50 text-sm text-slate-500">
              {org.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {org.address}</p>}
              {org.phone && <p className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {org.phone}</p>}
            </div>
          </div>
        ))}
      </div>
      
      {filteredOrgs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No organizations found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default UserServices;
