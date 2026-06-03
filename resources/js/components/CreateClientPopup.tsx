import { LoaderCircle } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

interface Props {
  clientGroups: {
    id: number;
    name: string;
  }[];
  statuses: Record<string, string>;
  onSuccess?: (client: any) => void;
}

export default function CreateClientPopup({
  clientGroups,
  statuses,
 // semrush,
  onSuccess,
}: Props) {
  const animatedComponents = makeAnimated();

  const { data, setData, post, processing, errors, reset } = useForm({
    company_name: '',
    domain:'',
    client_groups: [] as string[],
    logo: null as File | null,
    status: '',
    from_popup: true,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setData('logo', e.target.files[0]);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    post(route('admin.clients.store'), {
      preserveScroll: true,
      onSuccess: (page) => {
        const newClient = page.props.client;
        onSuccess?.(newClient);
        reset();
      },
    });
  };



  
  return (
    <form onSubmit={submit} className="space-y-5">
     

      {/* Company Name */}
      <div className="grid gap-2">
        <Label>Company Name</Label>
        <Input
          value={data.company_name}
          onChange={(e) => setData('company_name', e.target.value)}
          required
        />
        <InputError message={errors.company_name} />
      </div>

      {/* Client Groups */}
      <div className="grid gap-2">
        <Label>Client Groups</Label>
        <ReactSelect
          isMulti
          options={clientGroups.map(group => ({
            value: group.id.toString(),
            label: group.name,
          }))}
          value={data.client_groups.map(id => ({
            value: id,
            label: clientGroups.find(g => g.id.toString() === id)?.name,
          }))}
          onChange={(options) =>
            setData(
              'client_groups',
              options.map(o => o.value)
            )
          }
          components={animatedComponents}
          closeMenuOnSelect={false}
        />
        <InputError message={errors.client_groups} />
      </div>

      {/* Logo */}
      <div className="grid gap-2">
        <Label>Logo</Label>
        <Input type="file" accept="image/*" onChange={handleFileChange} />
        <InputError message={errors.logo} />
      </div>

      {/* Status */}
      <div className="grid gap-2">
        <Label>Status</Label>
        <Select value={data.status} onValueChange={(v) => setData('status', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              {Object.entries(statuses).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <InputError message={errors.status} />
      </div>

    {/* {semrush === 'semrush' && (
          <div className="grid gap-2">
            <Label>Add Domain</Label>
            <Input
              value={data.domain}
              onChange={(e) => setData('domain', e.target.value)}
            />
            <InputError message={errors.domain} />
          </div>

    )} */}

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={processing}>
          {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
          Create Client
        </Button>
      </div>
    </form>
  );
}
