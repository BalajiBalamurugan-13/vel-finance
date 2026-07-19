import PageHeader from "../components/PageHeader";
import { useEffect, useState } from "react";
import {
    getCustomers,
    getCustomerDetails
} from "../services/customerService";
import CustomerCard from "../components/Customer/CustomerCard";
import CustomerProfileDrawer from "../components/Customer/CustomerProfileDrawer";

function ViewCustomer() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
    async function loadCustomers() {

        const data = await getCustomers();

        setCustomers(data);

    }
    useEffect(() => {

      loadCustomers();

  }, []);
    async function openCustomer(customerId, showLoading = true) {

        setSelectedCustomer(customerId);

        if (showLoading) {
            setCustomerDetails(null);
        }

        const data = await getCustomerDetails(customerId);

        setCustomerDetails(data);
        

    }
    const filteredCustomers = customers.filter((customer) => {

    const query = search.toLowerCase();
    return (
        customer.name.toLowerCase().includes(query) ||
        customer.customer_id.toString().includes(query) ||
        customer.address.toLowerCase().includes(query) ||
        (customer.phone || "").includes(query)
    );

});

    return (

        <div>

            <PageHeader
                title="Customers"
                subtitle="Search and manage customers"
            />
            <div className="mt-8 mb-6">

                <input
                    type="text"
                    placeholder="🔍 Search by Name, ID or Place..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="
                        w-full
                        bg-slate-900
                        border
                        border-slate-700
                        rounded-xl
                        px-5
                        py-4
                        text-white
                        placeholder:text-slate-500
                        focus:outline-none
                        focus:border-green-500
                    "
                />

            </div>
            <div className="space-y-4 mt-8">

                {filteredCustomers
                    .slice() // create a copy
                    .sort((a, b) => a.customer_id - b.customer_id)
                    .map((customer) => (

                        <CustomerCard
                            key={customer.customer_id}
                            customer={customer}
                            onClick={() => openCustomer(customer.customer_id)}
                        />

                ))}
                {filteredCustomers.length === 0 && (

                    <div className="text-center text-gray-400 py-16">

                        No customers found.

                    </div>

                )}

            </div>
            <CustomerProfileDrawer
                open={selectedCustomer !== null}
                onClose={() => {
                    setSelectedCustomer(null);
                    setCustomerDetails(null);
                }}
                customer={customerDetails}
                refreshCustomer={openCustomer}
                refreshCustomers={loadCustomers}
            />

        </div>
        

    );

}

export default ViewCustomer;